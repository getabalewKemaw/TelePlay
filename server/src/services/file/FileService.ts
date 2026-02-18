import prisma from '../../lib/prisma.js';
import type { FileMetadataDto, ListFilesRequestDto } from '../../dto/file.dto.js';
import { promises as fs } from 'fs';
import path from 'path';
import { isdirectoryExists } from '../../utils/fileUtils.js';
import { AUDIO_EXTENSIONS, getPathVariations, parseDecodedFilename } from '../../utils/fileUtils.js';
import { chunkingService } from '../chunking/ChunkingService.js';
import { ffmpegService } from '../ffmpeg/FFmpegService.js';
import type { AudioCodec, SampleRate, ChannelConfig } from '../../types/ffmpeg/FFmpegTypes.js';

const ALLOWED_SORT_FIELDS = new Set([
    'createdAt',
    'updatedAt',
    'filename',
    'duration',
    'format',
    'codec',
    'bitrate',
    'status'
]);

const chunking = chunkingService;
const processedDir = path.resolve(process.env.PROCESSED_DIR || './processed');

const inferDecodeCodec = (filename: string, codec?: string | null): AudioCodec | undefined => {
    const name = filename.toLowerCase();
    const codecName = (codec || '').toLowerCase();

    if (codecName.includes('alaw') || name.includes('g711a') || name.includes('alaw')) return 'pcm_alaw';
    if (codecName.includes('mulaw') || name.includes('g711u') || name.includes('g711') || name.includes('mulaw')) return 'pcm_mulaw';
    if (codecName === 'g726' || name.includes('g726')) return 'g726';
    if (codecName === 'g728' || name.includes('g728')) return 'g728';
    if (codecName === 'pcm_mulaw' || codecName === 'pcm_alaw' || codecName === 'adpcm_g726') return codecName as AudioCodec;
    if (name.endsWith('.g711') || name.endsWith('.g711u') || name.endsWith('.g711a')) return 'pcm_mulaw';

    return undefined;
};

const inferSampleRate = (codec?: AudioCodec): SampleRate | undefined => {
    if (codec === 'g728') return 16000;
    if (codec === 'g726' || codec === 'pcm_mulaw' || codec === 'pcm_alaw') return 8000;
    return undefined;
};

const inferChannels = (codec?: AudioCodec): ChannelConfig | undefined => {
    if (codec === 'g728' || codec === 'g726' || codec === 'pcm_mulaw' || codec === 'pcm_alaw') return 1;
    return undefined;
};

const inferG726Bitrate = (bitrate?: number | null): number | undefined => {
    if (!bitrate || !Number.isFinite(bitrate)) return 32;
    const kbps = bitrate >= 1000 ? Math.round(bitrate / 1000) : bitrate;
    const supported = [8, 16, 24, 32];
    let closest = supported[0]!;
    for (const value of supported) {
        if (Math.abs(value - kbps) < Math.abs(closest - kbps)) {
            closest = value;
        }
    }
    return closest;
};

const buildDecodedOutputPath = (filename: string): string => {
    const base = path.parse(filename).name;
    return path.join(processedDir, `${base}_decoded.mp3`);
};

const tryAutoDecode = async (file: {
    id: string;
    filename: string;
    originalPath: string;
    decodedPath?: string | null;
    codec?: string | null;
    bitrate?: number | null;
}): Promise<void> => {
    if (file.decodedPath) return;

    const outputPath = buildDecodedOutputPath(file.filename);
    try {
        await fs.access(outputPath);
        await prisma.mediaFile.update({
            where: { id: file.id },
            data: { decodedPath: outputPath, status: 'ready' }
        });
        return;
    } catch {
        // output does not exist, continue and decode
    }

    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    const codec = inferDecodeCodec(file.filename, file.codec);
    const sampleRate = inferSampleRate(codec);
    const channels = inferChannels(codec);
    const bitrate = codec === 'g726' ? inferG726Bitrate(file.bitrate) : undefined;

    await ffmpegService.decode({
        input: { path: file.originalPath },
        output: { path: outputPath, format: 'mp3' },
        codec,
        sampleRate,
        channels,
        bitrate
    });

    await prisma.mediaFile.update({
        where: { id: file.id },
        data: { decodedPath: outputPath, status: 'ready' }
    });
};

const toFileMetadataDto = (file: any): FileMetadataDto => {
    return {
        ...file,
        fileSize: file.fileSize?.toString()
    };
};

export const discoverFiles = async (directoryPath: string): Promise<void> => {
    const dirExists = await isdirectoryExists(directoryPath);
    if (!dirExists) return;

    const directoriesToScan: string[] = [directoryPath];
    const filesToProcess: string[] = [];

    while (directoriesToScan.length > 0) {
        const dir = directoriesToScan.shift();
        if (!dir) break;

        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    directoriesToScan.push(fullPath);
                    continue;
                }
                if (entry.isFile()) {
                    const ext = path.extname(entry.name).toLowerCase();
                    if (AUDIO_EXTENSIONS.includes(ext)) {
                        filesToProcess.push(fullPath);
                    }
                }
            }
        } catch (error) {
            // keep scanning other folders if one directory fails (e.g. permissions)
            console.error(`Skipping ${dir}:`, error);
        }
    }

    const maxConcurrencyRaw = Number(process.env.DISCOVERY_FILE_CONCURRENCY || 8);
    const maxConcurrency = Math.max(1, Math.min(32, Number.isFinite(maxConcurrencyRaw) ? maxConcurrencyRaw : 8));
    let currentIndex = 0;

    const workers = Array.from({ length: maxConcurrency }, async () => {
        while (currentIndex < filesToProcess.length) {
            const index = currentIndex++;
            const filePath = filesToProcess[index];
            if (!filePath) continue;
            try {
                const file = await processFile(filePath);
                try {
                    await tryAutoDecode(file);
                } catch (decodeError) {
                    console.error(`Auto decode failed for ${filePath}:`, decodeError);
                }
            } catch (error) {
                console.error(`Failed to discover file ${filePath}:`, error);
            }
        }
    });

    await Promise.all(workers);
};

export const listFiles = async (criteria: ListFilesRequestDto): Promise<{ files: FileMetadataDto[]; total: number }> => {
    const { query, sort = 'createdAt', order = 'desc', page, limit, decodedOnly } = criteria;
    //serve side validation for the  page sizes
    const hasPageParam = typeof page === 'number' && Number.isFinite(page);
    const hasLimitParam = typeof limit === 'number' && Number.isFinite(limit);
    const safePage = hasPageParam ? Math.max(1, page) : undefined;
    const safeLimit = hasLimitParam ? Math.max(1, Math.min(limit, 100)) : undefined; // prevent the user from requating  a limit like 99999 and crashing the serve memory

    const where: any = query ? {
        OR: [
            { filename: { contains: query, mode: 'insensitive' as any } },
            { format: { contains: query, mode: 'insensitive' as any } },
            { codec: { contains: query, mode: 'insensitive' as any } },
        ]
    } : {};
    if (decodedOnly) {
        where.decodedPath = { not: null };
    }

    const hasPagination = typeof safePage === 'number' && typeof safeLimit === 'number' && safePage > 0 && safeLimit > 0;
    const safeSort = ALLOWED_SORT_FIELDS.has(sort) ? sort : 'createdAt';
    const safeOrder: 'asc' | 'desc' = order === 'asc' ? 'asc' : 'desc';
    const queryOptions: any = {
        where,
        orderBy: { [safeSort]: safeOrder },
    };

    if (hasPagination) {
        queryOptions.skip = (safePage - 1) * safeLimit;
        queryOptions.take = safeLimit;
    }

    const [files, total] = await Promise.all([
        prisma.mediaFile.findMany(queryOptions),
        prisma.mediaFile.count({ where }),
    ]);

    return {
        files: files.map((f: any) => toFileMetadataDto(f)),
        total
    };
};

export const getFileMetadata = async (id: string): Promise<FileMetadataDto> => {
    const file = await prisma.mediaFile.findUnique({ where: { id } });
    if (!file) throw new Error('File not found');
    return toFileMetadataDto(file);
};

// taking a file path and either linking to the existing database or creating a record in a database 
export const processFile = async (filePath: string): Promise<FileMetadataDto> => {
    const normalizedPath = path.resolve(filePath);
    const filename = path.basename(normalizedPath);
    const pathVariations = getPathVariations(normalizedPath);
    const pathFilters = pathVariations.flatMap((value) => ([
        { originalPath: { equals: value, mode: 'insensitive' as const } },
        { decodedPath: { equals: value, mode: 'insensitive' as const } }
    ]));
    const existing = await prisma.mediaFile.findFirst({
        where: {
            OR: pathFilters
        }
    });
    if (existing) return toFileMetadataDto(existing);

    const sourceStem = parseDecodedFilename(filename);
    if (sourceStem) {
        const sourceFile = await prisma.mediaFile.findFirst({
            where: {
                OR: AUDIO_EXTENSIONS.map((ext) => ({
                    filename: { equals: `${sourceStem}${ext}`, mode: 'insensitive' as const }
                }))
            },
            orderBy: { updatedAt: 'desc' }
        });

        if (sourceFile) {
            const updated = await prisma.mediaFile.update({
                where: { id: sourceFile.id },
                data: {
                    decodedPath: normalizedPath,
                    status: 'ready'
                }
            });
            return toFileMetadataDto(updated);
        }
    }

    try {
        const metadataResult = await chunking.getMetadata(normalizedPath);
        const file = await prisma.mediaFile.upsert({
            where: { originalPath: normalizedPath },
            create: {
                filename,
                originalPath: normalizedPath,
                duration: metadataResult.duration,
                fileSize: metadataResult.fileSize ? BigInt(metadataResult.fileSize) : null,
                format: metadataResult.format,
                codec: metadataResult.codec,
                bitrate: metadataResult.bitrate,
                status: 'ready'
            },
            update: {
                filename,
                duration: metadataResult.duration,
                fileSize: metadataResult.fileSize ? BigInt(metadataResult.fileSize) : null,
                format: metadataResult.format,
                codec: metadataResult.codec,
                bitrate: metadataResult.bitrate,
                status: 'ready'
            }
        });
        return toFileMetadataDto(file);
    } catch (error) {
        console.error(`Failed to process file ${normalizedPath}:`, error);
        const file = await prisma.mediaFile.upsert({
            where: { originalPath: normalizedPath },
            create: {
                filename,
                originalPath: normalizedPath,
                duration: 0,
                status: 'error',
                metadata: { error: (error as Error).message } as any
            },
            update: {
                filename
            }
        });
        return toFileMetadataDto(file);
    }
};

export const registerFile = async (filename: string, filePath: string): Promise<FileMetadataDto> => {
    const file = await processFile(filePath);
    try {
        await tryAutoDecode(file);
        const updated = await prisma.mediaFile.findUnique({ where: { id: file.id } });
        if (updated) return toFileMetadataDto(updated);
    } catch (error) {
        console.error(`Auto decode failed for uploaded file ${filePath}:`, error);
    }
    return file;
};

export const fileService = {
    discoverFiles,
    listFiles,
    getFileMetadata,
    processFile,
    registerFile
};

export type FileService = typeof fileService;

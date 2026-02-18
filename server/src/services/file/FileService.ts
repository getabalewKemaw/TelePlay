import prisma from '../../lib/prisma.js';
import type { FileMetadataDto, ListFilesRequestDto } from '../../dto/file.dto.js';
import { promises as fs } from 'fs';
import path from 'path';
import { isdirectoryExists } from '../../utils/fileUtils.js';
import { AUDIO_EXTENSIONS, getPathVariations, parseDecodedFilename } from '../../utils/fileUtils.js';
import { chunkingService } from '../chunking/ChunkingService.js';
import { ffmpegService } from '../ffmpeg/FFmpegService.js';
import type { AudioCodec, SampleRate, ChannelConfig } from '../../types/ffmpeg/FFmpegTypes.js';
import { ALLOWED_SORT_FIELDS } from '../../constants/file/index.js';
const chunking = chunkingService;
const processedDir = path.resolve(process.env.PROCESSED_DIR || './processed');
const activeAutoDecodeJobs = new Set<string>();
const decodeProgressStep = 1;

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

const buildTempDecodedOutputPath = (fileId: string, filename: string): string => {
    const base = path.parse(filename).name;
    return path.join(processedDir, `${base}_decoded.${fileId}.partial.mp3`);
};

const coerceDecodeProgress = (value: unknown): number | undefined => {
    if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
    return Math.max(0, Math.min(100, value));
};

const toFileMetadataDto = (file: any): FileMetadataDto => {
    const decodeProgress = coerceDecodeProgress(file?.metadata?.decodeProgress);
    return {
        ...file,
        fileSize: file.fileSize?.toString(),
        decodeProgress
    };
};

const tryAutoDecode = async (file: {
    id: string;
    filename: string;
    originalPath: string;
    duration?: number | null;
    decodedPath?: string | null;
    codec?: string | null;
    bitrate?: number | null;
}): Promise<void> => {
    if (file.decodedPath) {
        await prisma.mediaFile.update({
            where: { id: file.id },
            data: {
                status: 'ready',
                metadata: {
                    decodeProgress: 100,
                    decodeState: 'completed'
                } as any
            }
        });
        return;
    }

    const finalOutputPath = buildDecodedOutputPath(file.filename);
    const tempOutputPath = buildTempDecodedOutputPath(file.id, file.filename);
    try {
        await fs.access(finalOutputPath);
        await prisma.mediaFile.update({
            where: { id: file.id },
            data: {
                decodedPath: finalOutputPath,
                status: 'ready',
                metadata: {
                    decodeProgress: 100,
                    decodeState: 'completed'
                } as any
            }
        });
        return;
    } catch {
        // output does not exist, continue and decode
    }

    await fs.mkdir(path.dirname(finalOutputPath), { recursive: true });
    await prisma.mediaFile.update({
        where: { id: file.id },
        data: {
            status: 'processing',
            metadata: {
                decodeProgress: 0,
                decodeState: 'processing'
            } as any
        }
    });

    const codec = inferDecodeCodec(file.filename, file.codec);
    const sampleRate = inferSampleRate(codec);
    const channels = inferChannels(codec);
    const bitrate = codec === 'g726' ? inferG726Bitrate(file.bitrate) : undefined;
    let lastPersistedProgress = -decodeProgressStep;
    const totalDurationMs = (file.duration && Number.isFinite(file.duration) && file.duration > 0)
        ? file.duration * 1000
        : undefined;

    await fs.rm(tempOutputPath, { force: true }).catch(() => undefined);

    await ffmpegService.decode({
        input: { path: file.originalPath },
        output: { path: tempOutputPath, format: 'mp3' },
        codec,
        sampleRate,
        channels,
        bitrate,
        onProgress: (update) => {
            if (!totalDurationMs || typeof update.out_time_ms !== 'number') return;
            const progress = Math.floor(Math.max(0, Math.min(100, (update.out_time_ms / totalDurationMs) * 100)));
            if (progress < lastPersistedProgress + decodeProgressStep && progress !== 100) return;
            lastPersistedProgress = progress;
            void prisma.mediaFile.update({
                where: { id: file.id },
                data: {
                    status: 'processing',
                    metadata: {
                        decodeProgress: progress,
                        decodeState: 'processing'
                    } as any
                }
            }).catch(() => undefined);
        }
    });

    await fs.rename(tempOutputPath, finalOutputPath);

    await prisma.mediaFile.update({
        where: { id: file.id },
        data: {
            decodedPath: finalOutputPath,
            status: 'ready',
            metadata: {
                decodeProgress: 100,
                decodeState: 'completed'
            } as any
        }
    });
};
const scheduleAutoDecode = (file: {
    id: string;
    filename: string;
    originalPath: string;
    duration?: number | null;
    decodedPath?: string | null;
    codec?: string | null;
    bitrate?: number | null;
}): void => {
    if (file.decodedPath) return;
    if (activeAutoDecodeJobs.has(file.id)) return;

    activeAutoDecodeJobs.add(file.id);
    void tryAutoDecode(file)
        .catch(async (error) => {
            await prisma.mediaFile.update({
                where: { id: file.id },
                data: {
                    status: 'error',
                    metadata: {
                        error: error instanceof Error ? error.message : String(error),
                        decodeState: 'failed'
                    } as any
                }
            }).catch(() => undefined);
            console.error(`Auto decode failed for file ${file.originalPath}:`, error);
        })
        .finally(() => {
            const tempOutputPath = buildTempDecodedOutputPath(file.id, file.filename);
            void fs.rm(tempOutputPath, { force: true }).catch(() => undefined);
            activeAutoDecodeJobs.delete(file.id);
        });
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
                scheduleAutoDecode(file);
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
                    status: 'ready',
                    metadata: { decodeProgress: 100, decodeState: 'completed' } as any
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
                status: 'pending',
                metadata: { decodeProgress: 0, decodeState: 'pending' } as any
            },
            update: {
                filename,
                duration: metadataResult.duration,
                fileSize: metadataResult.fileSize ? BigInt(metadataResult.fileSize) : null,
                format: metadataResult.format,
                codec: metadataResult.codec,
                bitrate: metadataResult.bitrate,
                status: 'pending',
                metadata: { decodeProgress: 0, decodeState: 'pending' } as any
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
    scheduleAutoDecode(file);

    if (!file.decodedPath && file.status !== 'processing') {
        return {
            ...file,
            status: 'processing',
            decodeProgress: 0
        };
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

import type { FileMetadataDto, ListFilesRequestDto } from '../../dto/file.dto.js';
import path from 'path';
import { AUDIO_EXTENSIONS, getPathVariations, parseDecodedFilename, toFileMetadataDto } from '../../utils/fileUtils.js';
import { chunkingService } from '../chunking/ChunkingService.js';
import { ALLOWED_SORT_FIELDS } from '../../constants/file/index.js';
import { fileRepository } from '../../repositories/file/FileRepository.js';
import { fileDiscoveryService } from './FileDiscoveryService.js';
import { fileDecodeService, type FileRecord } from './FileDecodeService.js';
import { notFoundError } from '../../errors/common/HttpErrors.js';
const chunking = chunkingService;
export const discoverFiles = async (directoryPath: string): Promise<void> => {
    const filesToProcess = await fileDiscoveryService.discoverAudioFiles(directoryPath);
    if (filesToProcess.length === 0) return;

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
                fileDecodeService.scheduleAutoDecode(file as FileRecord);
            } catch (error) {
                console.error(`Failed to discover file ${filePath}:`, error);
            }
        }
    });

    await Promise.all(workers);
};

export const listFiles = async (criteria: ListFilesRequestDto): Promise<{ files: FileMetadataDto[]; total: number }> => {
    const { query, sort = 'createdAt', order = 'desc', page, limit, decodedOnly } = criteria;
    // Server-side validation for page sizes.
    const hasPageParam = typeof page === 'number' && Number.isFinite(page);
    const hasLimitParam = typeof limit === 'number' && Number.isFinite(limit);
    const safePage = hasPageParam ? Math.max(1, page) : undefined;
    const safeLimit = hasLimitParam ? Math.max(1, Math.min(limit, 100)) : undefined; // Prevent requesting a huge limit that could exhaust memory.

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
        fileRepository.listFiles(queryOptions),
        fileRepository.countFiles(where),
    ]);

    return {
        files: files.map((f: any) => toFileMetadataDto(f)),
        total
    };
};

export const getFileMetadata = async (id: string): Promise<FileMetadataDto> => {
    const file = await fileRepository.findById(id);
    if (!file) throw notFoundError('File not found', 'FILE_NOT_FOUND');
    return toFileMetadataDto(file);
};

// Take a file path and either link to the existing database or create a record.
export const processFile = async (filePath: string): Promise<FileMetadataDto> => {
    const normalizedPath = path.resolve(filePath);
    const filename = path.basename(normalizedPath);
    const pathVariations = getPathVariations(normalizedPath);
    const pathFilters = pathVariations.flatMap((value) => ([
        { originalPath: { equals: value, mode: 'insensitive' as const } },
        { decodedPath: { equals: value, mode: 'insensitive' as const } }
    ]));
    const existing = await fileRepository.findFirstByPathFilters(pathFilters);
    if (existing) return toFileMetadataDto(existing);

    const sourceStem = parseDecodedFilename(filename);
    if (sourceStem) {
        const sourceFile = await fileRepository.findSourceFileByStem(sourceStem, AUDIO_EXTENSIONS);

        if (sourceFile) {
            await fileRepository.updateStatusReady(sourceFile.id, normalizedPath);
            const refreshed = await fileRepository.findById(sourceFile.id);
            return toFileMetadataDto(refreshed);
        }
    }
    try {
        const metadataResult = await chunking.getMetadata(normalizedPath);
        const file = await fileRepository.upsertWithMetadata(normalizedPath, filename, metadataResult);
        return toFileMetadataDto(file);
    } catch (error) {
        console.error(`Failed to process file ${normalizedPath}:`, error);
        const file = await fileRepository.upsertWithError(
            normalizedPath,
            filename,
            (error as Error).message
        );
        return toFileMetadataDto(file);
    }
};

export const registerFile = async (filename: string, filePath: string): Promise<FileMetadataDto> => {
    const file = await processFile(filePath);
    fileDecodeService.scheduleAutoDecode(file as FileRecord);

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

import type { IFileService } from '../../interfaces/file/IFileService.js';
import type { IChunkingService } from '../../interfaces/chunking/IChunkingService.js';
import prisma from '../../lib/prisma.js';
import type { FileMetadataDto, ListFilesRequestDto } from '../../dto/file.dto.js';
import { promises as fs } from 'fs';
import path from 'path';
import { isdirectoryExists } from '../../utils/fileUtils.js';

import { AUDIO_EXTENSIONS, getPathVariations, parseDecodedFilename } from '../../utils/fileUtils.js';
export class FileService implements IFileService {
    constructor(private readonly chunkingService: IChunkingService) { }

    private toFileMetadataDto(file: any): FileMetadataDto {
        return {
            ...file,
            fileSize: file.fileSize?.toString()
        };
    }

    async discoverFiles(directoryPath: string): Promise<void> {
        const dirExists= await isdirectoryExists(directoryPath);
        if(!dirExists)return;
        const scan = async (dir: string) => {
            try {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            //map each entry to a promise so they can run in parellel
            await Promise.all(entries.map(async (entry)=>{
            const fullPath = path.join(dir, entry.name);
             if(entry.isDirectory()){
                // it scan all the folders insided recursivelly
                return scan(fullPath);
             }
             if (entry.isFile()){
                const ext=path.extname(entry.name).toLowerCase();
                if(AUDIO_EXTENSIONS.includes(ext)){
                    return await  this.processFile(fullPath);
                }
             }
            }));
            } catch (error) {
                // log the error like the permission issues but keep scannign other folders
              console.error(`skipping${dir}: `,error)
            }
        };
        await scan(directoryPath);
    }

    async listFiles(criteria: ListFilesRequestDto): Promise<{ files: FileMetadataDto[]; total: number }> {
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
        const queryOptions: any = {
            where,
            orderBy: { [sort]: order },
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
            files: files.map((f: any) => this.toFileMetadataDto(f)),
            total
        };
    }

    async getFileMetadata(id: string): Promise<FileMetadataDto> {
        const file = await prisma.mediaFile.findUnique({ where: { id } });
        if (!file) throw new Error('File not found');
        return this.toFileMetadataDto(file);

    }

    // taking a file path and either linking to the existing database or creating a record in a database 
    async processFile(filePath: string): Promise<FileMetadataDto> {
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
        if (existing) return this.toFileMetadataDto(existing);



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
                return this.toFileMetadataDto(updated);
            }
        }

        try {
            const metadataResult = await (this.chunkingService as any).metadataProvider.getMetadata(normalizedPath);
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
            return this.toFileMetadataDto(file);
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
            return this.toFileMetadataDto(file);
        }
    }

    async registerFile(filename: string, filePath: string): Promise<FileMetadataDto> {
        return this.processFile(filePath);
    }
}

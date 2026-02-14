import type { IFileService } from '../../interfaces/file/IFileService.js';
import type { IChunkingService } from '../../interfaces/chunking/IChunkingService.js';
import prisma from '../../lib/prisma.js';
import type { ListFilesRequestDto } from '../../dto/file.dto.js';
import { promises as fs } from 'fs';
import path from 'path';
import { isdirectoryExists } from '../../utils/fileutils.js';

export class FileService implements IFileService {
    constructor(private readonly chunkingService: IChunkingService) { }

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
                const audioExtensions = [
                    '.g711', '.g711u', '.g711a', '.g726', '.g728', 
                    '.pcm', '.wav', '.mp3', '.aac', '.ogg'
                ];
                if(audioExtensions.includes(ext)){
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

    async listFiles(criteria: ListFilesRequestDto): Promise<{ files: any[]; total: number }> {
        const { query, sort = 'createdAt', order = 'desc', page, limit, decodedOnly } = criteria;
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

        const hasPagination = typeof page === 'number' && typeof limit === 'number' && page > 0 && limit > 0;
        const queryOptions: any = {
            where,
            orderBy: { [sort]: order },
        };

        if (hasPagination) {
            queryOptions.skip = (page - 1) * limit;
            queryOptions.take = limit;
        }

        const [files, total] = await Promise.all([
            prisma.mediaFile.findMany(queryOptions),
            prisma.mediaFile.count({ where }),
        ]);

        return {
            files: files.map((f: any) => ({ ...f, fileSize: f.fileSize?.toString() })), // Convert BigInt to string
            total
        };
    }

    async getFileMetadata(id: string): Promise<any> {
        const file = await prisma.mediaFile.findUnique({ where: { id } });
        if (!file) throw new Error('File not found');
        return { ...file, fileSize: file.fileSize?.toString() };
    }

    async processFile(filePath: string): Promise<any> {
        const normalizedPath = path.resolve(filePath);
        const relativePath = path.relative(process.cwd(), normalizedPath);
        const filename = path.basename(normalizedPath);
        const existing = await prisma.mediaFile.findFirst({
            where: {
                OR: [
                    { originalPath: normalizedPath },
                    { originalPath: filePath },
                    { originalPath: relativePath },
                    { decodedPath: normalizedPath },
                    { decodedPath: filePath },
                    { decodedPath: relativePath }
                ]
            }
        });
        if (existing) return existing;

        const decodedMatch = filename.match(/^(.*)_decoded\.(wav|mp3|aac|ogg)$/i);
        if (decodedMatch?.[1]) {
            const sourceStem = decodedMatch[1];
            const sourceFile = await prisma.mediaFile.findFirst({
                where: {
                    OR: [
                        { filename: `${sourceStem}.g711` },
                        { filename: `${sourceStem}.g711a` },
                        { filename: `${sourceStem}.g711u` },
                        { filename: `${sourceStem}.g726` },
                        { filename: `${sourceStem}.g728` },
                        { filename: `${sourceStem}.pcm` },
                        { filename: `${sourceStem}.wav` },
                        { filename: `${sourceStem}.mp3` }
                    ]
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
                return { ...updated, fileSize: updated.fileSize?.toString() };
            }
        }

        try {
            const metadataResult = await (this.chunkingService as any).metadataProvider.getMetadata(normalizedPath);

            const file = await prisma.mediaFile.create({
                data: {
                    filename,
                    originalPath: normalizedPath,
                    duration: metadataResult.duration,
                    fileSize: metadataResult.fileSize ? BigInt(metadataResult.fileSize) : null,
                    format: metadataResult.format,
                    codec: metadataResult.codec,
                    bitrate: metadataResult.bitrate,
                    status: 'ready'
                }
            });
            return { ...file, fileSize: file.fileSize?.toString() };
        } catch (error) {
            console.error(`Failed to process file ${normalizedPath}:`, error);
            const file = await prisma.mediaFile.create({
                data: {
                    filename,
                    originalPath: normalizedPath,
                    duration: 0,
                    status: 'error',
                    metadata: { error: (error as Error).message } as any
                }
            });
            return { ...file, fileSize: file.fileSize?.toString() };
        }
    }

    async registerFile(filename: string, filePath: string): Promise<any> {
        return this.processFile(filePath);
    }
}

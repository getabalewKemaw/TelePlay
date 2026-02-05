import type { IFileService } from '../../interfaces/file/IFileService.js';
import type { IChunkingService } from '../../interfaces/chunking/IChunkingService.js';
import prisma from '../../lib/prisma.js';
import type { ListFilesRequestDto } from '../../dto/file.dto.js';
import { promises as fs } from 'fs';
import path from 'path';
import { existsSync } from 'fs';

export class FileService implements IFileService {
    constructor(private readonly chunkingService: IChunkingService) { }

    async discoverFiles(directoryPath: string): Promise<void> {
        if (!existsSync(directoryPath)) return;

        // Recursive directory read (Node.js 20+ supports { recursive: true } for readdir, 
        // but for compatibility we'll use a manual recursive approach or a helper if strict node version isn't guaranteed. 
        // Actually, modern Node.js fs.readdir with recursive: true returns file names, but paths are tricky.
        // Let's stick to a robust manual recursion for clarity and control.

        const scan = async (dir: string) => {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    await scan(fullPath);
                } else if (entry.isFile()) {
                    const ext = path.extname(entry.name).toLowerCase();
                    if (['.g711', '.g711u', '.g711a', '.g726', '.g728', '.pcm', '.wav'].includes(ext)) {
                        await this.processFile(fullPath);
                    }
                }
            }
        };

        await scan(directoryPath);
    }

    async listFiles(criteria: ListFilesRequestDto): Promise<{ files: any[]; total: number }> {
        const { query, sort = 'createdAt', order = 'desc', page = 1, limit = 10 } = criteria;

        const where = query ? {
            OR: [
                { filename: { contains: query, mode: 'insensitive' as any } },
                { format: { contains: query, mode: 'insensitive' as any } },
                { codec: { contains: query, mode: 'insensitive' as any } },
            ]
        } : {};

        const [files, total] = await Promise.all([
            prisma.mediaFile.findMany({
                where,
                orderBy: { [sort]: order },
                skip: (page - 1) * limit,
                take: limit,
            }),
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

        // Check if already exists
        const existing = await prisma.mediaFile.findFirst({
            where: {
                OR: [
                    { originalPath: normalizedPath },
                    { originalPath: filePath },
                    { originalPath: relativePath }
                ]
            }
        });
        if (existing) return existing;

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
            // Create with error status
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

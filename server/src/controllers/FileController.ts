import type { Request, Response, NextFunction } from 'express';
import type { IFileService } from '../interfaces/file/IFileService.js';
import { FileService } from '../services/file/FileService.js';
import { ChunkingService } from '../services/chunking/ChunkingService.js';
import path from 'path';

export class FileController {
    private fileService: IFileService;

    constructor(fileService?: IFileService) {
        // In a real app, use dependency injection
        this.fileService = fileService || new FileService(new ChunkingService() as any);
    }

    listFiles = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { query, sort, order, page, limit } = req.query;
            const result = await this.fileService.listFiles({
                query: query as string,
                sort: (sort as string) || 'createdAt',
                order: (order as 'asc' | 'desc') || 'desc',
                page: page ? parseInt(page as string) : 1,
                limit: limit ? parseInt(limit as string) : 10,
            });

            res.json({
                success: true,
                data: result.files,
                meta: {
                    total: result.total,
                    page: page ? parseInt(page as string) : 1,
                    limit: limit ? parseInt(limit as string) : 10,
                    timestamp: new Date().toISOString(),
                    version: '1.0.0'
                }
            });
        } catch (error) {
            next(error);
        }
    };

    getFileMetadata = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const metadata = await this.fileService.getFileMetadata(id as string);
            res.json({
                success: true,
                data: metadata,
                meta: { timestamp: new Date().toISOString(), version: '1.0.0' }
            });
        } catch (error) {
            next(error);
        }
    };

    discoverFiles = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const uploadsDir = './uploads';
            await this.fileService.discoverFiles(uploadsDir);
            res.json({
                success: true,
                message: 'Discovery completed',
                meta: { timestamp: new Date().toISOString(), version: '1.0.0' }
            });
        } catch (error) {
            next(error);
        }
    };

    downloadFile = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const file = await this.fileService.getFileMetadata(id as string);

            // Prefer decoded path if it exists
            const filePath = file.decodedPath || file.originalPath;
            const absolutePath = path.resolve(filePath);

            // Format filename for download (ensure it has correct extension if decoded)
            let downloadName = file.filename;
            if (file.decodedPath && !downloadName.toLowerCase().endsWith('.wav')) {
                downloadName = downloadName.split('.')[0] + '.wav';
            }

            res.download(absolutePath, downloadName);
        } catch (error) {
            next(error);
        }
    };
}

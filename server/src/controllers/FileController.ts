import type { Request, Response, NextFunction } from 'express';
import type { IFileService } from '../interfaces/file/IFileService.js';
import { FileService } from '../services/file/FileService.js';
import { ChunkingService } from '../services/chunking/ChunkingService.js';
import path from 'path';

export class FileController {
    private fileService: IFileService;
    constructor(fileService?: IFileService) {
        this.fileService = fileService || new FileService(new ChunkingService() as any);
    }
// pagination and sorting.
    listFiles = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { query, sort, order, page, limit } = req.query;
            const parsedPage = page ? parseInt(page as string, 10) : undefined;
            const parsedLimit = limit ? parseInt(limit as string, 10) : undefined;

            const result = await this.fileService.listFiles({
                query: query as string,
                sort: (sort as string) || 'createdAt',
                order: (order as 'asc' | 'desc') || 'desc',
                page: Number.isFinite(parsedPage as number) ? parsedPage : undefined,
                limit: Number.isFinite(parsedLimit as number) ? parsedLimit : undefined,
            });

            res.json({
                success: true,
                data: result.files,
                meta: {
                    total: result.total,
                    page: Number.isFinite(parsedPage as number) ? parsedPage : null,
                    limit: Number.isFinite(parsedLimit as number) ? parsedLimit : null,
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
    //folder scanning.
    discoverFiles = async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Allow user to specify path, default to ./uploads
            const { path: customPath } = req.body;
            const targetDir = customPath || './uploads';

            await this.fileService.discoverFiles(targetDir);

            res.json({
                success: true,
                message: `Discovery completed for ${targetDir}`,
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

            // Format filename for download (use decoded extension if available)
            let downloadName = file.filename;
            if (file.decodedPath) {
                const ext = path.extname(file.decodedPath);
                if (ext) {
                    downloadName = downloadName.split('.')[0] + ext;
                }
            }

            res.download(absolutePath, downloadName);
        } catch (error) {
            next(error);
        }
    };

    uploadFile = async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.file) {
                throw new Error('No file uploaded');
            }
            // Register it in the system
            const result = await this.fileService.registerFile(req.file.filename, req.file.path);
            res.json({
                success: true,
                data: this.normalizeFile(result),
                meta: { timestamp: new Date().toISOString(), version: '1.0.0' }
            });
        } catch (error) {
            next(error);
        }
    };


 //convert the massive number in to a string before sending to the user preventing a  server crashs.
    private normalizeFile(file: any) {
        if (!file) return file;
        if (typeof file.fileSize === 'bigint') {
            return { ...file, fileSize: file.fileSize.toString() };
        }
        return file;
    }
}

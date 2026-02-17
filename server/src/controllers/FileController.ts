import type { Request, Response, NextFunction } from 'express';
import { fileService } from '../services/file/FileService.js';
import path from 'path';
import { enforcePathPolicy } from '../utils/pathPolicy.js';

//convert the massive number in to a string before sending to the user preventing a  server crashs.
const normalizeFile = (file: any) => {
    if (!file) return file;
    if (typeof file.fileSize === 'bigint') {
        return { ...file, fileSize: file.fileSize.toString() };
    }
    return file;
};

// pagination and sorting.
export const listFiles = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { query, sort, order, page, limit, decodedOnly } = req.query;
        const parsedPage = page ? parseInt(page as string, 10) : undefined;
        const parsedLimit = limit ? parseInt(limit as string, 10) : undefined;
        const hasPageParam = Number.isFinite(parsedPage as number);
        const hasLimitParam = Number.isFinite(parsedLimit as number);
        const safePage = hasPageParam ? Math.max(1, parsedPage as number) : undefined;
        const safeLimit = hasLimitParam ? Math.max(1, parsedLimit as number) : undefined;
        const parsedDecodedOnly =
            decodedOnly === 'true' || decodedOnly === '1';

        const result = await fileService.listFiles({
            query: query as string,
            sort: (sort as string) || 'createdAt',
            order: (order as 'asc' | 'desc') || 'desc',
            page: safePage,
            limit: safeLimit,
            decodedOnly: parsedDecodedOnly || undefined,
        });

        res.json({
            success: true,
            data: result.files,
            meta: {
                total: result.total,
                page: safePage ?? null,
                limit: safeLimit ?? null,
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            }
        });
    } catch (error) {
        next(error);
    }
};

export const getFileMetadata = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const metadata = await fileService.getFileMetadata(id as string);
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
export const discoverFiles = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Allow user to specify path, default to ./uploads
        const { path: customPath } = req.body;
        const targetDir = enforcePathPolicy(customPath || './uploads', 'Discovery path');

        await fileService.discoverFiles(targetDir);

        res.json({
            success: true,
            message: `Discovery completed for ${targetDir}`,
            meta: { timestamp: new Date().toISOString(), version: '1.0.0' }
        });
    } catch (error) {
        next(error);
    }
};

export const downloadFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const file = await fileService.getFileMetadata(id as string);

        // Prefer decoded path if it exists
        const filePath = file.decodedPath || file.originalPath;
        const absolutePath = enforcePathPolicy(filePath, 'Download path');

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

export const uploadFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.file) {
            throw new Error('No file uploaded');
        }
        // Register it in the system
        const result = await fileService.registerFile(req.file.filename, req.file.path);
        res.json({
            success: true,
            data: normalizeFile(result),
            meta: { timestamp: new Date().toISOString(), version: '1.0.0' }
        });
    } catch (error) {
        next(error);
    }
};

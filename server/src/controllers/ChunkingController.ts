
import type { Request, Response, NextFunction } from 'express';
import { ChunkingService } from '../services/chunking/ChunkingService.js';
import type { ChunkAccessRequestDto } from '../dto/chunking.dto.js';
import type { IChunkingService } from '../interfaces/ffmpeg/IChunkingService.js';

/**
 * Controller for Media Chunking operations
 */
export class ChunkingController {
    private chunkingService: IChunkingService;

    constructor(chunkingService?: IChunkingService) {
        this.chunkingService = chunkingService || new (ChunkingService as any)();
    }

    /**
     * GET /api/chunks
     * Query params: filePath
     */
    getAllChunks = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const filePath = req.query.filePath as string;
            if (!filePath) {
                return res.status(400).json({ success: false, message: 'filePath is required' });
            }
            const chunks = await this.chunkingService.getAllChunks(filePath);
            res.status(200).json({
                success: true,
                data: chunks
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * GET /api/chunks/at-time
     * Query params: filePath, time
     */
    getChunkAtTime = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const filePath = req.query.filePath as string;
            const time = parseFloat(req.query.time as string);

            if (!filePath || isNaN(time)) {
                return res.status(400).json({ success: false, message: 'filePath and valid time are required' });
            }

            const chunk = await this.chunkingService.getChunkAtTime(filePath, time);
            res.status(200).json({
                success: true,
                data: chunk
            });
        } catch (error) {
            next(error);
        }
    };
}

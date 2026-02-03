
import type { Request, Response, NextFunction } from 'express';
import { CompressionService } from '../services/compression/CompressionService.js';
import type { CompressRequestDto } from '../dto/compression.dto.js';
import type { ICompressionService } from '../interfaces/ffmpeg/ICompressionService.js';

/**
 * Controller for Media Compression operations
 */
export class CompressionController {
    private compressionService: ICompressionService;

    constructor(compressionService?: ICompressionService) {
        // Assuming CompressionService satisfies ICompressionService
        this.compressionService = compressionService || new (CompressionService as any)();
    }

    /**
     * POST /api/compress
     */
    compress = async (req: Request<{}, {}, CompressRequestDto>, res: Response, next: NextFunction) => {
        try {
            const { inputPath, options } = req.body;
            const result = await this.compressionService.compress(inputPath, options);
            res.status(200).json({
                success: true,
                message: 'Compression task initiated/completed',
                data: result
            });
        } catch (error) {
            next(error);
        }
    };
}

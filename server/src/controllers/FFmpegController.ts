
import type { Request, Response, NextFunction } from 'express';
import { FFmpegService } from '../services/ffmpeg/FFmpegService.js';
import type { DecodeRequestDto, EncodeRequestDto, TranscodeRequestDto } from '../dto/ffmpeg.dto.js';
import type { IFfmpegService } from '../interfaces/ffmpeg/IFfmpegService.js';
import type { ApiResponse } from '../dto/base.dto.js';
import prisma from '../lib/prisma.js';

export class FFmpegController {
    private ffmpegService: IFfmpegService;

    constructor(ffmpegService?: IFfmpegService) {
        this.ffmpegService = ffmpegService || new FFmpegService();
    }

    decode = async (req: Request<{}, {}, DecodeRequestDto>, res: Response, next: NextFunction) => {
        try {
            const { fileId, ...decodeParams } = req.body;
            const result = await this.ffmpegService.decode(decodeParams);

            // If we have a fileId, update the database with the decoded path
            if (fileId && result.success && result.outputPath) {
                await prisma.mediaFile.update({
                    where: { id: fileId },
                    data: {
                        decodedPath: result.outputPath,
                        status: 'ready'
                    }
                });
            }

            const response: ApiResponse<any> = {
                success: true,
                data: result,
                meta: {
                    timestamp: new Date().toISOString(),
                    version: '1.0.0'
                }
            };
            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    };

    encode = async (req: Request<{}, {}, EncodeRequestDto>, res: Response, next: NextFunction) => {
        try {
            const result = await this.ffmpegService.encode(req.body);
            const response: ApiResponse<any> = {
                success: true,
                data: result,
                meta: {
                    timestamp: new Date().toISOString(),
                    version: '1.0.0'
                }
            };
            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    };

    transcode = async (req: Request<{}, {}, TranscodeRequestDto>, res: Response, next: NextFunction) => {
        try {
            const result = await this.ffmpegService.transcode(req.body);
            const response: ApiResponse<any> = {
                success: true,
                data: result,
                meta: {
                    timestamp: new Date().toISOString(),
                    version: '1.0.0'
                }
            };
            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    };
}


import type { Request, Response, NextFunction } from 'express';
import { FFmpegService } from '../services/ffmpeg/FFmpegService.js';
import type { DecodeRequestDto, EncodeRequestDto, TranscodeRequestDto } from '../dto/ffmpeg.dto.js';
import type { IFfmpegService } from '../interfaces/ffmpeg/IFfmpegService.js';
import type { ApiResponse } from '../dto/base.dto.js';
import prisma from '../lib/prisma.js';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';
export class FFmpegController {
    private ffmpegService: IFfmpegService;
    constructor(ffmpegService?: IFfmpegService) {
        this.ffmpegService = ffmpegService || new FFmpegService();
    }
    // reqparams,resbody,req.body,query
    decode = async (req: Request<{}, {}, DecodeRequestDto>, res: Response, next: NextFunction) => {
        try {
            const { fileId, ...decodeParams } = req.body;
            const requestedOutputPath = decodeParams.output?.path ? path.resolve(decodeParams.output.path) : undefined;
            if (fileId) {
                const existing = await prisma.mediaFile.findUnique({ where: { id: fileId } });
                const existingDecoded = existing?.decodedPath ? path.resolve(existing.decodedPath) : undefined;
                if (existingDecoded && existsSync(existingDecoded)) {
                    if (!requestedOutputPath || requestedOutputPath === existingDecoded) {
                        return res.status(409).json({
                            success: false,
                            error: { message: 'File already decoded', code: 'ALREADY_DECODED' },
                            data: { outputPath: existingDecoded },
                            meta: { timestamp: new Date().toISOString(), version: '1.0.0' }
                        });
                    }
                }
            }

            const outputPath = requestedOutputPath;
            if (outputPath) {
                if (decodeParams.output) {
                    decodeParams.output.path = outputPath;
                }
                const outputDir = path.dirname(outputPath);
                if (!existsSync(outputDir)) {
                    mkdirSync(outputDir, { recursive: true });
                }
                if (existsSync(outputPath)) {
                    if (fileId) {
                        await prisma.mediaFile.update({
                            where: { id: fileId },
                            data: {
                                decodedPath: outputPath,
                                status: 'ready'
                            }
                        });
                    }
                    const response: ApiResponse<any> = {
                        success: true,
                        data: { success: true, outputPath, alreadyDecoded: true },
                        meta: {
                            timestamp: new Date().toISOString(),
                            version: '1.0.0'
                        }
                    };
                    return res.status(200).json(response);
                }
            }

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

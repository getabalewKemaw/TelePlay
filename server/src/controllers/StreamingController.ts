
import type { Request, Response, NextFunction } from 'express';
import { StreamingPreparationService } from '../services/streaming/StreamingPreparationService.js';
import type { CreateSessionRequestDto, PlaybackControlRequestDto, PrepareItemsRequestDto } from '../dto/streaming.dto.js';
import type { IStreamingPreparationService } from '../interfaces/ffmpeg/IStreamingPreparationService.js';
import type { ApiResponse } from '../dto/base.dto.js';
import path from 'path';
import fs from 'fs';

export class StreamingController {
    private streamingService: IStreamingPreparationService;

    constructor(streamingService?: IStreamingPreparationService) {
        this.streamingService = streamingService || new (StreamingPreparationService as any)();
    }

    createSession = async (req: Request<{}, {}, CreateSessionRequestDto>, res: Response, next: NextFunction) => {
        try {
            const { filePath, options } = req.body;
            const resolvedPath = path.isAbsolute(filePath) ? filePath : path.resolve(filePath);
            const session = await this.streamingService.createSession(resolvedPath, options);
            const response: ApiResponse<any> = {
                success: true,
                data: session,
                meta: { timestamp: new Date().toISOString(), version: '1.0.0' }
            };
            res.status(201).json(response);
        } catch (error) {
            next(error);
        }
    };

    prepareChunks = async (req: Request<{ sessionId: string }, {}, PrepareItemsRequestDto>, res: Response, next: NextFunction) => {
        try {
            const { sessionId } = req.params;
            const { indices } = req.body;
            const chunks = await this.streamingService.prepareChunks(sessionId, indices);
            const response: ApiResponse<any> = {
                success: true,
                data: chunks,
                meta: { timestamp: new Date().toISOString(), version: '1.0.0' }
            };
            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    };

    handlePlaybackControl = async (req: Request<{ sessionId: string }, {}, PlaybackControlRequestDto>, res: Response, next: NextFunction) => {
        try {
            const { sessionId } = req.params;
            const result = await this.streamingService.handlePlaybackControl(sessionId, req.body);
            const response: ApiResponse<any> = {
                success: true,
                data: result,
                meta: { timestamp: new Date().toISOString(), version: '1.0.0' }
            };
            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    };

    getStreamMetadata = async (req: Request<{ sessionId: string }>, res: Response, next: NextFunction) => {
        try {
            const { sessionId } = req.params;
            const metadata = await this.streamingService.getStreamMetadata(sessionId);
            const response: ApiResponse<any> = {
                success: true,
                data: metadata,
                meta: { timestamp: new Date().toISOString(), version: '1.0.0' }
            };
            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    };

    cleanupSession = async (req: Request<{ sessionId: string }>, res: Response, next: NextFunction) => {
        try {
            const { sessionId } = req.params;
            await this.streamingService.cleanupSession(sessionId);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    };

    stream = async (req: Request<{ sessionId: string }>, res: Response, next: NextFunction) => {
        try {
            const { sessionId } = req.params;
            const session = await this.streamingService.getSession(sessionId);

            if (!session) {
                return res.status(404).json({ success: false, message: 'Session not found' });
            }

            const filePath = path.resolve(session.filePath);
            const stat = await fs.promises.stat(filePath);
            const range = req.headers.range;

            const ext = path.extname(filePath).toLowerCase();
            const mimeType = ext === '.mp3' ? 'audio/mpeg' : ext === '.wav' ? 'audio/wav' : 'application/octet-stream';

            if (!range) {
                res.writeHead(200, {
                    'Content-Length': stat.size,
                    'Content-Type': mimeType,
                    'Accept-Ranges': 'bytes'
                });
                fs.createReadStream(filePath).pipe(res);
                return;
            }

            const match = /^bytes=(\d+)-(\d*)$/.exec(range);
            if (!match) {
                res.status(416).set('Content-Range', `bytes */${stat.size}`).end();
                return;
            }

            const start = parseInt(match[1], 10);
            const end = match[2] ? Math.min(parseInt(match[2], 10), stat.size - 1) : stat.size - 1;

            if (start >= stat.size || end < start) {
                res.status(416).set('Content-Range', `bytes */${stat.size}`).end();
                return;
            }

            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${stat.size}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': end - start + 1,
                'Content-Type': mimeType
            });

            fs.createReadStream(filePath, { start, end }).pipe(res);
        } catch (error) {
            next(error);
        }
    };
}

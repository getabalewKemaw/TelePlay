
import type { Request, Response, NextFunction } from 'express';
import { StreamingPreparationService } from '../services/streaming/StreamingPreparationService.js';
import type { CreateSessionRequestDto, PlaybackControlRequestDto, PrepareItemsRequestDto } from '../dto/streaming.dto.js';
import type { IStreamingPreparationService } from '../interfaces/ffmpeg/IStreamingPreparationService.js';
import type { ApiResponse } from '../dto/base.dto.js';
import path from 'path';

export class StreamingController {
    private streamingService: IStreamingPreparationService;

    constructor(streamingService?: IStreamingPreparationService) {
        this.streamingService = streamingService || new (StreamingPreparationService as any)();
    }

    createSession = async (req: Request<{}, {}, CreateSessionRequestDto>, res: Response, next: NextFunction) => {
        try {
            const { filePath, options } = req.body;
            const session = await this.streamingService.createSession(filePath, options);
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

            res.sendFile(path.resolve(session.filePath));
        } catch (error) {
            next(error);
        }
    };
}


import type { Request, Response, NextFunction } from 'express';
import { StreamingPreparationService } from '../services/streaming/StreamingPreparationService.js';
import { ChunkingService } from '../services/chunking/ChunkingService.js';
import { SegmentationService } from '../services/segmentation/SegmentationService.js';
import { StreamingChunkService } from '../services/streaming/StreamingChunkService.js';
import type { CreateSessionRequestDto } from '../dto/streaming.dto.js';
import type { IStreamingPreparationService } from '../interfaces/streaming/IStreamingPreparationService.js';
import type { ApiResponse } from '../dto/base.dto.js';
import type { StreamingSession } from '../types/streaming/StreamingTypes.js';
import path from 'path';
export class StreamingController {
    private streamingService: IStreamingPreparationService;
    private chunkingService: ChunkingService;
    private segmentationService: SegmentationService;
    private chunkService: StreamingChunkService;

    constructor(streamingService?: IStreamingPreparationService) {
        this.streamingService = streamingService ?? new StreamingPreparationService();
        this.chunkingService = new ChunkingService();
        this.segmentationService = new SegmentationService(this.chunkingService);
        this.chunkService = new StreamingChunkService(this.chunkingService);
    }
    private sendSuccess(res: Response, data: any, status = 200): void {
        const response: ApiResponse<any> = {
            success: true,
            data,
            meta: { timestamp: new Date().toISOString(), version: '1.0.0' }
        };
        res.status(status).json(response);
    }
    private async getSessionOr404(sessionId: string, res: Response): Promise<StreamingSession | null> {
        const session = await this.streamingService.getSession(sessionId);
        if (!session) {
            res.status(404).json({ success: false, message: 'Session not found' });
            return null;
        }
        return session;
    }

    createSession = async (req: Request<{}, {}, CreateSessionRequestDto>, res: Response, next: NextFunction) => {
        try {
            const { filePath, options } = req.body;
            const resolvedPath = path.isAbsolute(filePath) ? filePath : path.resolve(filePath);
            const session = await this.streamingService.createSession(resolvedPath, options);
            this.sendSuccess(res, session, 201);
        } catch (error) {
            next(error);
        }
    };

    getChunks = async (req: Request<{ sessionId: string }>, res: Response, next: NextFunction) => {
        try {
            const { sessionId } = req.params;
            const session = await this.getSessionOr404(sessionId, res);
            if (!session) return;
            const chunkDuration = this.chunkService.getSessionChunkDuration(session);
            const chunks = await this.chunkingService.getAllChunks(session.filePath, { chunkDuration });
            this.sendSuccess(res, chunks);
        } catch (error) {
            next(error);
        }
    };

    getSegments = async (req: Request<{ sessionId: string }>, res: Response, next: NextFunction) => {
        try {
            const { sessionId } = req.params;
            const session = await this.getSessionOr404(sessionId, res);
            if (!session) return;

            const chunksPerSegmentRaw = typeof req.query.chunksPerSegment === 'string'
                ? parseInt(req.query.chunksPerSegment, 10)
                : 3;
            const chunksPerSegment = Number.isFinite(chunksPerSegmentRaw) && chunksPerSegmentRaw > 0
                ? chunksPerSegmentRaw
                : 3;
            const baseChunkDuration = session.chunkDuration ?? 10;
            const segments = await this.segmentationService.getAllSegments(session.filePath, {
                strategy: 'adaptive',
                chunksPerSegment,
                targetSegmentDuration: Math.max(baseChunkDuration * chunksPerSegment, baseChunkDuration),
                optimizeForLowLatency: true,
                baseChunkDuration
            });
            this.sendSuccess(res, segments);
        } catch (error) {
            next(error);
        }
    };
    getChunkPeaks = async (req: Request<{ sessionId: string; index: string }>, res: Response, next: NextFunction) => {
        try {
            const { sessionId, index } = req.params;
            const session = await this.getSessionOr404(sessionId, res);
            if (!session) return;

            const chunk = await this.chunkService.resolveSessionChunk(session, index);
            if (!chunk) {
                return res.status(404).json({ success: false, message: 'Chunk not found' });
            }

            const binsRaw = typeof req.query.bins === 'string' ? parseInt(req.query.bins, 10) : 100;
            const bins = Number.isFinite(binsRaw) ? Math.min(Math.max(binsRaw, 10), 1000) : 100;
            const peaks = await this.chunkService.getChunkPeaks(session, chunk, bins);
            this.sendSuccess(res, peaks);
        } catch (error) {
            next(error);
        }
    };

    stream = async (req: Request<{ sessionId: string }>, res: Response, next: NextFunction) => {
        try {
            const { sessionId } = req.params;
            const session = await this.getSessionOr404(sessionId, res);
            if (!session) return;

            if (session.mode === 'live') {
                this.chunkService.streamLive(session, res);
                return;
            }
            await this.chunkService.streamFileBased(session, req.headers.range, res);
        } catch (error) {
            next(error);
        }
    };

    streamChunk = async (req: Request<{ sessionId: string; index: string }>, res: Response, next: NextFunction) => {
        try {
            const { sessionId, index } = req.params;
            const session = await this.getSessionOr404(sessionId, res);
            if (!session) return;

            const chunk = await this.chunkService.resolveSessionChunk(session, index);
            if (!chunk) {
                return res.status(404).json({ success: false, message: 'Chunk not found' });
            }

            const requestedFormat = typeof req.query.format === 'string' ? req.query.format : undefined;
            this.chunkService.streamChunk(session, chunk, requestedFormat, res);
        } catch (error) {
            next(error);
        }
    };
}

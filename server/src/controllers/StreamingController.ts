
import type { Request, Response, NextFunction } from 'express';
import { StreamingPreparationService } from '../services/streaming/StreamingPreparationService.js';
import { ChunkingService } from '../services/chunking/ChunkingService.js';
import { SegmentationService } from '../services/segmentation/SegmentationService.js';
import { StreamingChunkService } from '../services/streaming/StreamingChunkService.js';
import type { CreateSessionRequestDto, PlaybackControlRequestDto, PrepareItemsRequestDto } from '../dto/streaming.dto.js';
import type { IStreamingPreparationService } from '../interfaces/streaming/IStreamingPreparationService.js';
import type { ApiResponse } from '../dto/base.dto.js';
import path from 'path';
export class StreamingController {
    private streamingService: IStreamingPreparationService;
    private chunkingService: ChunkingService;
    private segmentationService: SegmentationService;
    private chunkService: StreamingChunkService;

    constructor(streamingService?: IStreamingPreparationService) {
        this.streamingService = streamingService || new (StreamingPreparationService as any)();
        this.chunkingService = new (ChunkingService as any)();
        this.segmentationService = new (SegmentationService as any)(this.chunkingService);
        this.chunkService = new (StreamingChunkService as any)(this.chunkingService);
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

    getChunks = async (req: Request<{ sessionId: string }>, res: Response, next: NextFunction) => {
        try {
            const { sessionId } = req.params;
            const session = await this.streamingService.getSession(sessionId);
            if (!session) {
                return res.status(404).json({ success: false, message: 'Session not found' });
            }
            const chunkDuration = this.chunkService.getSessionChunkDuration(session);
            const chunks = await this.chunkingService.getAllChunks(session.filePath, { chunkDuration });
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

    getSegments = async (req: Request<{ sessionId: string }>, res: Response, next: NextFunction) => {
        try {
            const { sessionId } = req.params;
            const session = await this.streamingService.getSession(sessionId);
            if (!session) {
                return res.status(404).json({ success: false, message: 'Session not found' });
            }

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
            const response: ApiResponse<any> = {
                success: true,
                data: segments,
                meta: { timestamp: new Date().toISOString(), version: '1.0.0' }
            };
            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    };
    getChunkPeaks = async (req: Request<{ sessionId: string; index: string }>, res: Response, next: NextFunction) => {
        try {
            const { sessionId, index } = req.params;
            const session = await this.streamingService.getSession(sessionId);
            if (!session) {
                return res.status(404).json({ success: false, message: 'Session not found' });
            }

            const chunk = await this.chunkService.resolveSessionChunk(session, index);
            if (!chunk) {
                return res.status(404).json({ success: false, message: 'Chunk not found' });
            }

            const binsRaw = typeof req.query.bins === 'string' ? parseInt(req.query.bins, 10) : 100;
            const bins = Number.isFinite(binsRaw) ? Math.min(Math.max(binsRaw, 10), 1000) : 100;
            const peaks = await this.chunkService.getChunkPeaks(session, chunk, bins);
            const response: ApiResponse<any> = {
                success: true,
                data: peaks,
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
            const session = await this.streamingService.getSession(sessionId);

            if (!session) {
                return res.status(404).json({ success: false, message: 'Session not found' });
            }

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

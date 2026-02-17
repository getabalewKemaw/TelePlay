import type { Request, Response, NextFunction } from 'express';
import { streamingPreparationService } from '../services/streaming/StreamingPreparationService.js';
import { chunkingService } from '../services/chunking/ChunkingService.js';
import { segmentationService } from '../services/segmentation/SegmentationService.js';
import { streamingChunkService } from '../services/streaming/StreamingChunkService.js';
import type { CreateSessionRequestDto } from '../dto/streaming.dto.js';
import type { ApiResponse } from '../dto/base.dto.js';
import type { StreamingSession } from '../types/streaming/StreamingTypes.js';
import path from 'path';
import { enforcePathPolicy } from '../utils/pathPolicy.js';

const sendSuccess = (res: Response, data: any, status = 200): void => {
    const response: ApiResponse<any> = {
        success: true,
        data,
        meta: { timestamp: new Date().toISOString(), version: '1.0.0' }
    };
    res.status(status).json(response);
};

const getSessionOr404 = async (sessionId: string, res: Response): Promise<StreamingSession | null> => {
    const session = await streamingPreparationService.getSession(sessionId);
    if (!session) {
        res.status(404).json({ success: false, message: 'Session not found' });
        return null;
    }
    return session;
};

export const createSession = async (req: Request<{}, {}, CreateSessionRequestDto>, res: Response, next: NextFunction) => {
    try {
        const { filePath, options } = req.body;
        const resolvedPath = enforcePathPolicy(
            path.isAbsolute(filePath) ? filePath : path.resolve(filePath),
            'Session file path'
        );
        const session = await streamingPreparationService.createSession(resolvedPath, options);
        sendSuccess(res, session, 201);
    } catch (error) {
        next(error);
    }
};

export const getChunks = async (req: Request<{ sessionId: string }>, res: Response, next: NextFunction) => {
    try {
        const { sessionId } = req.params;
        const session = await getSessionOr404(sessionId, res);
        if (!session) return;
        const chunkDuration = streamingChunkService.getSessionChunkDuration(session);
        const chunks = await chunkingService.getAllChunks(session.filePath, { chunkDuration });
        sendSuccess(res, chunks);
    } catch (error) {
        next(error);
    }
};

export const getSegments = async (req: Request<{ sessionId: string }>, res: Response, next: NextFunction) => {
    try {
        const { sessionId } = req.params;
        const session = await getSessionOr404(sessionId, res);
        if (!session) return;

        const chunksPerSegmentRaw = typeof req.query.chunksPerSegment === 'string'
            ? parseInt(req.query.chunksPerSegment, 10)
            : 3;
        const chunksPerSegment = Number.isFinite(chunksPerSegmentRaw) && chunksPerSegmentRaw > 0
            ? chunksPerSegmentRaw
            : 3;
        const baseChunkDuration = session.chunkDuration ?? 10;
        const segments = await segmentationService.getAllSegments(session.filePath, {
            strategy: 'adaptive',
            chunksPerSegment,
            targetSegmentDuration: Math.max(baseChunkDuration * chunksPerSegment, baseChunkDuration),
            optimizeForLowLatency: true,
            baseChunkDuration
        });
        sendSuccess(res, segments);
    } catch (error) {
        next(error);
    }
};

export const getChunkPeaks = async (req: Request<{ sessionId: string; index: string }>, res: Response, next: NextFunction) => {
    try {
        const { sessionId, index } = req.params;
        const session = await getSessionOr404(sessionId, res);
        if (!session) return;

        const chunk = await streamingChunkService.resolveSessionChunk(session, index);
        if (!chunk) {
            return res.status(404).json({ success: false, message: 'Chunk not found' });
        }

        const binsRaw = typeof req.query.bins === 'string' ? parseInt(req.query.bins, 10) : 100;
        const bins = Number.isFinite(binsRaw) ? Math.min(Math.max(binsRaw, 10), 1000) : 100;
        const peaks = await streamingChunkService.getChunkPeaks(session, chunk, bins);
        sendSuccess(res, peaks);
    } catch (error) {
        next(error);
    }
};

export const stream = async (req: Request<{ sessionId: string }>, res: Response, next: NextFunction) => {
    try {
        const { sessionId } = req.params;
        const session = await getSessionOr404(sessionId, res);
        if (!session) return;

        if (session.mode === 'live') {
            streamingChunkService.streamLive(session, res);
            return;
        }
        await streamingChunkService.streamFileBased(session, req.headers.range, res);
    } catch (error) {
        next(error);
    }
};

export const streamChunk = async (req: Request<{ sessionId: string; index: string }>, res: Response, next: NextFunction) => {
    try {
        const { sessionId, index } = req.params;
        const session = await getSessionOr404(sessionId, res);
        if (!session) return;

        const chunk = await streamingChunkService.resolveSessionChunk(session, index);
        if (!chunk) {
            return res.status(404).json({ success: false, message: 'Chunk not found' });
        }

        const requestedFormat = typeof req.query.format === 'string' ? req.query.format : undefined;
        streamingChunkService.streamChunk(session, chunk, requestedFormat, res);
    } catch (error) {
        next(error);
    }
};

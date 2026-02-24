import type { Request, Response, NextFunction } from 'express';
import { streamingPreparationService } from '../services/streaming/StreamingPreparationService.js';
import { chunkingService } from '../services/chunking/ChunkingService.js';
import { segmentationService } from '../services/segmentation/SegmentationService.js';
import { streamingChunkService } from '../services/streaming/StreamingChunkService.js';
import type { CreateSessionRequestDto } from '../dto/streaming.dto.js';
import type { StreamingSession } from '../types/streaming/StreamingTypes.js';
import path from 'path';
import { enforcePathPolicy } from '../utils/pathPolicy.js';
import { sendSuccess } from '../utils/response.js';
import { parseIntQuery, parseNumberQuery } from '../utils/query.js';
import { badRequestError } from '../errors/common/HttpErrors.js';

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

        const chunksPerSegment = parseIntQuery(req.query.chunksPerSegment, 3, { min: 1 }) ?? 3;
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

        const bins = parseIntQuery(req.query.bins, 100, { min: 10, max: 1000 }) ?? 100;
        const peaks = await streamingChunkService.getChunkPeaks(session, chunk, bins);
        sendSuccess(res, peaks);
    } catch (error) {
        next(error);
    }
};

export const getChunkByTime = async (req: Request<{ sessionId: string }>, res: Response, next: NextFunction) => {
    try {
        const { sessionId } = req.params;
        const session = await getSessionOr404(sessionId, res);
        if (!session) return;

        const timeRaw = parseNumberQuery(req.query.time, Number.NaN) ?? Number.NaN;
        if (!Number.isFinite(timeRaw) || timeRaw < 0) {
            throw badRequestError('Invalid time query parameter', 'INVALID_TIME');
        }

        const chunkDuration = streamingChunkService.getSessionChunkDuration(session);
        const chunk = await chunkingService.getChunkAtTime(session.filePath, timeRaw, { chunkDuration });
        sendSuccess(res, chunk);
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
            const seekTimeRaw = parseNumberQuery(req.query.time, Number.NaN) ?? Number.NaN;
            if (Number.isFinite(seekTimeRaw) && seekTimeRaw >= 0) {
                const chunkDuration = streamingChunkService.getSessionChunkDuration(session);
                const chunk = await chunkingService.getChunkAtTime(session.filePath, seekTimeRaw, { chunkDuration });
                const requestedFormat = typeof req.query.format === 'string' ? req.query.format : undefined;
                streamingChunkService.streamChunk(session, chunk, requestedFormat, res);
                return;
            }
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

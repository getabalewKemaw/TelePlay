
import { Router } from 'express';
import { createSession, getChunks, getSegments, streamChunk, getChunkPeaks, getChunkByTime, stream } from '../controllers/StreamingController.js';
const router = Router();
router.post('/sessions', createSession);
router.get('/sessions/:sessionId/chunks', getChunks);
router.get('/sessions/:sessionId/chunks/by-time', getChunkByTime);
router.get('/sessions/:sessionId/segments', getSegments);
router.get('/sessions/:sessionId/chunks/:index/stream', streamChunk);
router.get('/sessions/:sessionId/chunks/:index/peaks', getChunkPeaks);
router.get('/sessions/:sessionId/stream', stream);
export default router;

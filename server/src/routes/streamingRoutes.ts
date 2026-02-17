
import { Router } from 'express';
import { createStreamingController } from '../controllers/StreamingController.js';
const router = Router();
const controller = createStreamingController();
router.post('/sessions', controller.createSession);
router.get('/sessions/:sessionId/chunks', controller.getChunks);
router.get('/sessions/:sessionId/segments', controller.getSegments);
router.get('/sessions/:sessionId/chunks/:index/stream', controller.streamChunk);
router.get('/sessions/:sessionId/chunks/:index/peaks', controller.getChunkPeaks);
router.get('/sessions/:sessionId/stream', controller.stream);
export default router;

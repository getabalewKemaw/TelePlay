
import { Router } from 'express';
import { StreamingController } from '../controllers/StreamingController.js';
const router = Router();
const controller = new StreamingController();
router.post('/sessions', controller.createSession);
router.post('/sessions/:sessionId/prepare-chunks', controller.prepareChunks);
router.post('/sessions/:sessionId/playback', controller.handlePlaybackControl);
router.get('/sessions/:sessionId/metadata', controller.getStreamMetadata);
router.get('/sessions/:sessionId/chunks', controller.getChunks);
router.get('/sessions/:sessionId/chunks/:index/stream', controller.streamChunk);
router.get('/sessions/:sessionId/chunks/:index/peaks', controller.getChunkPeaks);
router.get('/sessions/:sessionId/stream', controller.stream);
router.delete('/sessions/:sessionId', controller.cleanupSession);
export default router;

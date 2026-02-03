
import { Router } from 'express';
import { ChunkingController } from '../controllers/ChunkingController.js';

const router = Router();
const controller = new ChunkingController();

router.get('/', controller.getAllChunks);
router.get('/at-time', controller.getChunkAtTime);

export default router;

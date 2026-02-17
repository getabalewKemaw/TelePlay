
import { Router } from 'express';
import { createFFmpegController } from '../controllers/FFmpegController.js';
const router = Router();
const controller = createFFmpegController();
router.post('/decode', controller.decode);
export default router;

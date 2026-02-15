
import { Router } from 'express';
import { FFmpegController } from '../controllers/FFmpegController.js';
const router = Router();
const controller = new FFmpegController();
router.post('/decode', controller.decode);
export default router;

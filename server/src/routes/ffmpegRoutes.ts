
import { Router } from 'express';
import { FFmpegController } from '../controllers/FFmpegController.js';

const router = Router();
const controller = new FFmpegController();

router.post('/decode', controller.decode);
router.post('/encode', controller.encode);
router.post('/transcode', controller.transcode);

export default router;


import { Router } from 'express';
import ffmpegRoutes from './ffmpegRoutes.js';
import streamingRoutes from './streamingRoutes.js';
import fileRoutes from './fileRoutes.js';
import transcodingRoutes from './transcodingRoutes.js';
const router = Router();
router.use('/ffmpeg', ffmpegRoutes);
router.use('/streaming', streamingRoutes);
router.use('/files', fileRoutes);
router.use('/transcoding', transcodingRoutes);
export default router;

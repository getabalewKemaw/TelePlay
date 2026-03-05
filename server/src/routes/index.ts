
import { Router } from 'express';
import ffmpegRoutes from './ffmpegRoutes.js';
import streamingRoutes from './streamingRoutes.js';
import fileRoutes from './fileRoutes.js';
import transcodingRoutes from './transcodingRoutes.js';
const router = Router();
router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      uptime: process.uptime()
    },
    meta: {
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  });
});
router.use('/ffmpeg', ffmpegRoutes);
router.use('/streaming', streamingRoutes);
router.use('/files', fileRoutes);
router.use('/transcoding', transcodingRoutes);
export default router;

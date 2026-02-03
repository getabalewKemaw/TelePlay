
import { Router } from 'express';
import ffmpegRoutes from './ffmpegRoutes.js';
import compressionRoutes from './compressionRoutes.js';
import chunkingRoutes from './chunkingRoutes.js';
import segmentationRoutes from './segmentationRoutes.js';
import streamingRoutes from './streamingRoutes.js';
import fileRoutes from './fileRoutes.js';

const router = Router();

router.use('/ffmpeg', ffmpegRoutes);
router.use('/compress', compressionRoutes);
router.use('/chunks', chunkingRoutes);
router.use('/segments', segmentationRoutes);
router.use('/streaming', streamingRoutes);
router.use('/files', fileRoutes);

export default router;

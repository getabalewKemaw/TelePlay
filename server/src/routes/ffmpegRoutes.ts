
import { Router } from 'express';
import { decode } from '../controllers/FFmpegController.js';
const router = Router();
router.post('/decode', decode);
export default router;

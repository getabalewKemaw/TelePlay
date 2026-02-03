
import { Router } from 'express';
import { CompressionController } from '../controllers/CompressionController.js';

const router = Router();
const controller = new CompressionController();

router.post('/', controller.compress);

export default router;

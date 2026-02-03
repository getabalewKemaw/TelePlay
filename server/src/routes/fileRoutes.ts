import { Router } from 'express';
import { FileController } from '../controllers/FileController.js';

const router = Router();
const controller = new FileController();

router.get('/', controller.listFiles);
router.get('/:id', controller.getFileMetadata);
router.post('/discover', controller.discoverFiles);
router.get('/:id/download', controller.downloadFile);

export default router;

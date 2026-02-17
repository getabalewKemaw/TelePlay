import { Router } from 'express';
import { createTranscodingController } from '../controllers/TranscodingController.js';

const router = Router();
const controller = createTranscodingController();

router.post('/convert', controller.convert);
router.post('/convert-download', controller.convertDownload);
export default router;

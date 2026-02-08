import { Router } from 'express';
import { TranscodingController } from '../controllers/TranscodingController.js';

const router = Router();
const controller = new TranscodingController();

router.post('/convert', controller.convert);
router.post('/convert-download', controller.convertDownload);
export default router;

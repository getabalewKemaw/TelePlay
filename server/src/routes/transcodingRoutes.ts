import { Router } from 'express';
import { convert, convertDownload } from '../controllers/TranscodingController.js';

const router = Router();

router.post('/convert', convert);
router.post('/convert-download', convertDownload);
export default router;

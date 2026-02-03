
import { Router } from 'express';
import { SegmentationController } from '../controllers/SegmentationController.js';

const router = Router();
const controller = new SegmentationController();

router.get('/', controller.getAllSegments);
router.get('/range', controller.getSegmentsInRange);

export default router;

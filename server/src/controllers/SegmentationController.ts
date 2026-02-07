
import type { Request, Response, NextFunction } from 'express';
import { SegmentationService } from '../services/segmentation/SegmentationService.js';
import type { ISegmentationService } from '../interfaces/segmentation/ISegmentationService.js';
export class SegmentationController {
    private segmentationService: ISegmentationService;

    constructor(segmentationService?: ISegmentationService) {
        this.segmentationService = segmentationService || new (SegmentationService as any)();
    }
    getAllSegments = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const filePath = req.query.filePath as string;
            if (!filePath) {
                return res.status(400).json({ success: false, message: 'filePath is required' });
            }
            const segments = await this.segmentationService.getAllSegments(filePath);
            res.status(200).json({
                success: true,
                data: segments
            });
        } catch (error) {
            next(error);
        }
    };

    

    getSegmentsInRange = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const filePath = req.query.filePath as string;
            const startTime = parseFloat(req.query.startTime as string);
            const endTime = parseFloat(req.query.endTime as string);

            if (!filePath || isNaN(startTime) || isNaN(endTime)) {
                return res.status(400).json({ success: false, message: 'filePath, startTime, and endTime are required' });
            }

            const segments = await this.segmentationService.getSegmentsInRange(filePath, startTime, endTime);
            res.status(200).json({
                success: true,
                data: segments
            });
        } catch (error) {
            next(error);
        }
    };
}

import type { Request, Response, NextFunction } from 'express';
import { SegmentationService } from '../services/segmentation/SegmentationService.js';
import type { ISegmentationService } from '../interfaces/segmentation/ISegmentationService.js';
import {
  getRequiredFilePath,
  getRequiredRange,
  parseSegmentationOptions
} from '../utils/segmentation/segmentationRequestUtils.js';
export class SegmentationController {
  private readonly segmentationService: ISegmentationService;

  constructor(segmentationService?: ISegmentationService) {
    this.segmentationService = segmentationService ?? new SegmentationService();
  }

  getAllSegments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filePath = getRequiredFilePath(req.query as Record<string, unknown>);
      const options = parseSegmentationOptions(req.query as Record<string, unknown>);
      const segments = await this.segmentationService.getAllSegments(filePath, options);

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
      const query = req.query as Record<string, unknown>;
      const filePath = getRequiredFilePath(query);
      const { startTime, endTime } = getRequiredRange(query);
      const options = parseSegmentationOptions(query);
      const segments = await this.segmentationService.getSegmentsInRange(filePath, startTime, endTime, options);

      res.status(200).json({
        success: true,
        data: segments
      });
    } catch (error) {
      next(error);
    }
  };
}

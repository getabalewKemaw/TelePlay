/**
 * Segmentation Service Interface
 * Main service interface for media segmentation operations
 */

import type {
  SegmentMetadata,
  SegmentationOptions
} from '../../types/segmentation/SegmentationTypes.js';

export interface ISegmentationService {
  getAllSegments(filePath: string, options?: SegmentationOptions): Promise<SegmentMetadata[]>;
  getSegmentsInRange(
    filePath: string,
    startTime: number,
    endTime: number,
    options?: SegmentationOptions
  ): Promise<SegmentMetadata[]>;
}

/**
 * Segmentation Service Interface (for dependency injection)
 */

import type { SegmentMetadata } from '../../types/segementation/SegmentationTypes.js';

export interface ISegmentationService {
  getAllSegments(filePath: string, options?: any): Promise<SegmentMetadata[]>;
  getChunkAtTime(filePath: string, time: number, options?: any): Promise<SegmentMetadata>;
  getSegmentsInRange(filePath: string, startTime: number, endTime: number, options?: any): Promise<SegmentMetadata[]>;
}

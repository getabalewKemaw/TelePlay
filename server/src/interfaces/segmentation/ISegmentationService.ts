/**
 * Segmentation Service Interface
 * Main service interface for media segmentation operations
 */

import type {
  SegmentMetadata,
  SegmentationOptions
} from '../../types/segmentation/SegmentationTypes.js';


/**
 * Main segmentation service interface
 * Provides operations for grouping chunks into streaming segments
 */
export interface ISegmentationService {
  /**
   * Get all segments for a media file
   * @param filePath - Path to the media file
   * @param options - Segmentation options
   * @returns Promise resolving to array of segment metadata
   */
  getAllSegments(filePath: string, options?: SegmentationOptions): Promise<SegmentMetadata[]>;

  /**
   * Get segments for a time range
   * @param filePath - Path to the media file
   * @param startTime - Start time in seconds
   * @param endTime - End time in seconds
   * @param options - Segmentation options
   * @returns Promise resolving to array of segment metadata
   */
  getSegmentsInRange(
    filePath: string,
    startTime: number,
    endTime: number,
    options?: SegmentationOptions
  ): Promise<SegmentMetadata[]>;
}

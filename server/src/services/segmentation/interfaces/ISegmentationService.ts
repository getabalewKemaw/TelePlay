/**
 * Segmentation Service Interface
 * Main service interface for media segmentation operations
 */

import type {
  SegmentationResult,
  SegmentMetadata,
  SegmentationOptions,
  BufferingStrategy,
  PlaybackState,
  BufferingRecommendation
} from '../types/SegmentationTypes.js';

/**
 * Main segmentation service interface
 * Provides operations for grouping chunks into streaming segments
 */
export interface ISegmentationService {
  /**
   * Create segments from chunks for a media file
   * @param filePath - Path to the media file
   * @param options - Segmentation options
   * @returns Promise resolving to segmentation result
   */
  createSegments(filePath: string, options?: SegmentationOptions): Promise<SegmentationResult>;

  /**
   * Get segment metadata for a specific segment index
   * @param filePath - Path to the media file
   * @param segmentIndex - Zero-based segment index
   * @param options - Segmentation options
   * @returns Promise resolving to segment metadata
   */
  getSegment(
    filePath: string,
    segmentIndex: number,
    options?: SegmentationOptions
  ): Promise<SegmentMetadata>;

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

  /**
   * Get adaptive buffering recommendation
   * @param filePath - Path to the media file
   * @param playbackState - Current playback state
   * @param bufferingStrategy - Buffering strategy configuration
   * @param options - Segmentation options
   * @returns Promise resolving to buffering recommendation
   */
  getBufferingRecommendation(
    filePath: string,
    playbackState: PlaybackState,
    bufferingStrategy: BufferingStrategy,
    options?: SegmentationOptions
  ): Promise<BufferingRecommendation>;

  /**
   * Get initial segments for playback start (low-latency optimization)
   * @param filePath - Path to the media file
   * @param options - Segmentation options
   * @returns Promise resolving to array of critical segments
   */
  getInitialSegments(filePath: string, options?: SegmentationOptions): Promise<SegmentMetadata[]>;
}

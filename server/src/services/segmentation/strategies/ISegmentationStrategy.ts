/**
 * Segmentation Strategy Interface
 * Defines the contract for different segmentation strategies
 */

import type { ChunkMetadata } from '../../../types/chunking/ChunkingTypes.js';
import type { SegmentMetadata, SegmentationConfig } from '../../../types/segmentation/SegmentationTypes.js';

/**
 * Interface for segmentation strategies
 * Allows for different algorithms (fixed, adaptive, progressive, etc.)
 */
export interface ISegmentationStrategy {
  /**
   * Create segments from chunks
   * @param chunks - Array of chunk metadata
   * @param config - Segmentation configuration
   * @returns Array of segment metadata
   */
  createSegments(chunks: ChunkMetadata[], config: SegmentationConfig): SegmentMetadata[];

  /**
   * Get strategy name
   */
  getName(): string;
}

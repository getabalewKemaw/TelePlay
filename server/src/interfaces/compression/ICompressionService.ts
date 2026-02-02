/**
 * Compression Service Interface
 * Main service interface for media compression operations
 */


import type {  CompressionResult,
  CompressionOptions,
  CompressionPreset,
  CompressionMetrics,
  CompressionRecommendation } from '../../types/compression/CompressionTypes.js';


/**
 * Main compression service interface
 * Provides operations for compressing media files
 */
export interface ICompressionService {
  /**
   * Compress a media file
   * @param inputPath - Path to input media file
   * @param options - Compression options
   * @returns Promise resolving to compression result
   */
  compress(inputPath: string, options?: CompressionOptions): Promise<CompressionResult>;

  /**
   * Get compression recommendation for a file
   * @param inputPath - Path to input media file
   * @param targetSize - Optional target size in bytes
   * @returns Promise resolving to compression recommendation
   */
  getRecommendation(
    inputPath: string,
    targetSize?: number
  ): Promise<CompressionRecommendation>;

  /**
   * Get available compression presets
   * @returns Array of compression presets
   */
  getPresets(): CompressionPreset[];

  /**
   * Compress using a preset
   * @param inputPath - Path to input media file
   * @param presetName - Name of the preset to use
   * @param options - Additional compression options
   * @returns Promise resolving to compression result
   */
  compressWithPreset(
    inputPath: string,
    presetName: string,
    options?: CompressionOptions
  ): Promise<CompressionResult>;

  /**
   * Estimate compression result without actually compressing
   * @param inputPath - Path to input media file
   * @param options - Compression options
   * @returns Promise resolving to estimated metrics
   */
  estimateCompression(
    inputPath: string,
    options?: CompressionOptions
  ): Promise<CompressionMetrics>;
}

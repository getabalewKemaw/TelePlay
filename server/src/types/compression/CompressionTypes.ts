/**
 * Compression Service Types
 * Type definitions for media compression operations
 */

/**
 * Compression level/quality preset
 */
export type CompressionLevel = 'low' | 'medium' | 'high' | 'maximum';

/**
 * Compression strategy
 */
export type CompressionStrategy = 'size' | 'quality' | 'balanced' | 'fast';

/**
 * Compression mode - when to apply compression
 */
export type CompressionMode = 'pre-decode' | 'post-decode' | 'transcode';

/**
 * Compression configuration
 */
export interface CompressionConfig {
  /**
   * Compression level (affects quality vs size trade-off)
   * - 'low': Fast compression, larger files, higher quality
   * - 'medium': Balanced compression
   * - 'high': Slower compression, smaller files, lower quality
   * - 'maximum': Slowest compression, smallest files, lowest quality
   */
  level: CompressionLevel;

  /**
   * Compression strategy
   * - 'size': Optimize for smallest file size
   * - 'quality': Optimize for best quality
   * - 'balanced': Balance size and quality
   * - 'fast': Optimize for compression speed
   */
  strategy: CompressionStrategy;

  /**
   * Target bitrate in kbps (optional, overrides level if provided)
   */
  targetBitrate?: number | undefined;

  /**
   * Target file size in bytes (optional)
   */
  targetSize?: number | undefined;

  /**
   * Compression mode
   * - 'pre-decode': Compress before decoding (for encoded files)
   * - 'post-decode': Compress after decoding (for raw PCM)
   * - 'transcode': Compress during transcoding
   */
  mode: CompressionMode;

  /**
   * Output codec for compression
   * Default: 'aac' for audio
   */
  codec?: string;

  /**
   * Whether to preserve original file
   * Default: true
   */
  preserveOriginal?: boolean;
}

/**
 * Compression result
 */
export interface CompressionResult {
  /**
   * Path to compressed file
   */
  outputPath: string;

  /**
   * Original file size in bytes
   */
  originalSize: number;

  /**
   * Compressed file size in bytes
   */
  compressedSize: number;

  /**
   * Compression ratio (compressedSize / originalSize)
   * Lower is better (0.5 = 50% of original size)
   */
  compressionRatio: number;

  /**
   * Compression percentage (1 - compressionRatio) * 100
   * Higher is better (50% = 50% size reduction)
   */
  compressionPercentage: number;

  /**
   * Compression execution time in milliseconds
   */
  executionTime: number;

  /**
   * Estimated bandwidth savings in bytes
   */
  bandwidthSavings: number;

  /**
   * Configuration used for compression
   */
  config: CompressionConfig;
}

/**
 * Compression options
 */
export interface CompressionOptions {
  /**
   * Compression level
   */
  level?: CompressionLevel;

  /**
   * Compression strategy
   */
  strategy?: CompressionStrategy;

  /**
   * Target bitrate in kbps
   */
  targetBitrate?: number;

  /**
   * Target file size in bytes
   */
  targetSize?: number;

  /**
   * Compression mode
   */
  mode?: CompressionMode;

  /**
   * Output codec
   */
  codec?: string;

  /**
   * Preserve original file
   */
  preserveOriginal?: boolean;

  /**
   * Output file path (optional, auto-generated if not provided)
   */
  outputPath?: string;
}

/**
 * Compression preset
 * Pre-configured compression settings
 */
export interface CompressionPreset {
  /**
   * Preset name
   */
  name: string;

  /**
   * Compression level
   */
  level: CompressionLevel;

  /**
   * Compression strategy
   */
  strategy: CompressionStrategy;

  /**
   * Target bitrate in kbps
   */
  targetBitrate: number;

  /**
   * Description
   */
  description: string;

  /**
   * Use case
   */
  useCase: string;
}

/**
 * Compression performance metrics
 */
export interface CompressionMetrics {
  /**
   * Compression ratio achieved
   */
  compressionRatio: number;

  /**
   * Compression speed (bytes per second)
   */
  compressionSpeed: number;

  /**
   * Time to compress (milliseconds)
   */
  compressionTime: number;

  /**
   * Quality score (0-100, if available)
   */
  qualityScore?: number;
}

/**
 * Compression recommendation
 * Suggests compression settings based on file characteristics
 */
export interface CompressionRecommendation {
  /**
   * Recommended compression level
   */
  recommendedLevel: CompressionLevel;

  /**
   * Recommended strategy
   */
  recommendedStrategy: CompressionStrategy;

  /**
   * Recommended bitrate
   */
  recommendedBitrate?: number;

  /**
   * Expected compression ratio
   */
  expectedRatio: number;

  /**
   * Expected size reduction percentage
   */
  expectedReduction: number;

  /**
   * Reasoning for recommendation
   */
  reasoning: string;
}


export type CompressionLevel = 'low' | 'medium' | 'high' | 'maximum';
export type CompressionStrategy = 'size' | 'quality' | 'balanced' | 'fast';
export type CompressionMode = 'pre-decode' | 'post-decode' | 'transcode';
export interface CompressionConfig {
  level: CompressionLevel;
  strategy: CompressionStrategy;
  targetBitrate?: number | undefined;
  targetSize?: number | undefined;
  mode: CompressionMode;
  codec?: string;
  preserveOriginal?: boolean;
}
export interface CompressionResult {
  outputPath: string;
  originalSize: number;
  compressedSize: number;

  /**
   * compression  ratio (compressedSize / originalSize)
   * Lower is better (0.5 = 50% of original size)
   */
  compressionRatio: number;
  /**
   * compression percentage (1 - compressionRatio) * 100
   * higher is better (50% = 50% size reduction)
   */
  compressionPercentage: number;
  executionTime: number;
  bandwidthSavings: number;
  config: CompressionConfig;
}
export interface CompressionOptions {
  level?: CompressionLevel;
  strategy?: CompressionStrategy;
  targetBitrate?: number;
  targetSize?: number;
  mode?: CompressionMode;
  codec?: string;
  preserveOriginal?: boolean;
  outputPath?: string;
}
export interface CompressionPreset {

  name: string;
  level: CompressionLevel;
  strategy: CompressionStrategy;
  targetBitrate: number;
  description: string;
  useCase: string;
}
export interface CompressionMetrics {
  compressionRatio: number;
  compressionSpeed: number;
  compressionTime: number;
  qualityScore?: number;
}

/**
 * compression recommendation
 * Suggests compression settings based on file characteristics
 */
export interface CompressionRecommendation {
  recommendedLevel: CompressionLevel;
  recommendedStrategy: CompressionStrategy;
  recommendedBitrate?: number;
  expectedRatio: number;
  expectedReduction: number;
  reasoning: string;
}

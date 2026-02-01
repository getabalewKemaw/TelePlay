/**
 * Transcoding Service Interface
 * Main service interface for media transcoding operations
 */

import type {
  TranscodingResult,
  TranscodingOptions,
  ChunkTranscodingParams,
  SourceEncoding,
  TargetEncoding
} from '../types/TranscodingTypes.js';

/**
 * Main transcoding service interface
 * Provides operations for converting between codec formats
 */
export interface ITranscodingService {
  /**
   * Transcode a media file from source to target codec
   * @param inputPath - Path to input media file
   * @param options - Transcoding options
   * @returns Promise resolving to transcoding result
   */
  transcode(inputPath: string, options: TranscodingOptions): Promise<TranscodingResult>;

  /**
   * Transcode a chunk (partial file)
   * @param params - Chunk transcoding parameters
   * @returns Promise resolving to transcoding result
   */
  transcodeChunk(params: ChunkTranscodingParams): Promise<TranscodingResult>;

  /**
   * Transcode for streaming (time range)
   * @param inputPath - Path to input media file
   * @param startTime - Start time in seconds
   * @param duration - Duration in seconds
   * @param options - Transcoding options
   * @returns Promise resolving to transcoding result
   */
  transcodeForStreaming(
    inputPath: string,
    startTime: number,
    duration: number,
    options: TranscodingOptions
  ): Promise<TranscodingResult>;

  /**
   * Get recommended target codec for source codec
   * @param sourceCodec - Source codec
   * @returns Recommended target codec
   */
  getRecommendedTargetCodec(sourceCodec: string): string;

  /**
   * Check if transcoding is needed
   * @param inputPath - Path to input file
   * @param targetCodec - Target codec
   * @returns Promise resolving to true if transcoding is needed
   */
  isTranscodingNeeded(inputPath: string, targetCodec: string): Promise<boolean>;
}

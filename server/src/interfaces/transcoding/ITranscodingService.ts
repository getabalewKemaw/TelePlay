/**
 * Transcoding Service Interface
 * Main service interface for media transcoding operations
 */

import type {
  TranscodingResult,
  ChunkTranscodingParams
} from '../../types/transcoding/TranscodingTypes.js';

/**
 * Main transcoding service interface
 * Provides operations for converting between codec formats
 */
export interface ITranscodingService {
  /**
   * Transcode a chunk (partial file)
   * @param params - Chunk transcoding parameters
   * @returns Promise resolving to transcoding result
   */
  transcodeChunk(params: ChunkTranscodingParams): Promise<TranscodingResult>;

  /**
   * Get recommended target codec for source codec
   * @param sourceCodec - Source codec
   * @returns Recommended target codec
   */
  getRecommendedTargetCodec(sourceCodec: string): string;
}

/**
 * Compression Service Interface
 * Main service interface for media compression operations
 */


import type { CompressionResult,
  CompressionOptions } from '../../types/compression/CompressionTypes.js';


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
}

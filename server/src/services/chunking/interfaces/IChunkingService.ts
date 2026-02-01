/**
 * Chunking Service Interface
 * Main service interface for media chunking operations
 */

import type {
  ChunkingResult,
  ChunkMetadata,
  SeekParams,
  SeekResult,
  ChunkingOptions
} from '../types/ChunkingTypes.js';

/**
 * Main chunking service interface
 * Provides operations for time-based media chunking
 */
export interface IChunkingService {
  /**
   * Generate chunks for a media file
   * @param filePath - Path to the media file
   * @param options - Chunking options
   * @returns Promise resolving to chunking result with metadata
   */
  generateChunks(filePath: string, options?: ChunkingOptions): Promise<ChunkingResult>;

  /**
   * Get chunk metadata for a specific chunk index
   * @param filePath - Path to the media file
   * @param chunkIndex - Zero-based chunk index
   * @param options - Chunking options
   * @returns Promise resolving to chunk metadata
   */
  getChunk(filePath: string, chunkIndex: number, options?: ChunkingOptions): Promise<ChunkMetadata>;

  /**
   * Get all chunks for a media file
   * @param filePath - Path to the media file
   * @param options - Chunking options
   * @returns Promise resolving to array of chunk metadata
   */
  getAllChunks(filePath: string, options?: ChunkingOptions): Promise<ChunkMetadata[]>;

  /**
   * Seek to a specific time position
   * @param filePath - Path to the media file
   * @param params - Seek parameters
   * @param options - Chunking options
   * @returns Promise resolving to seek result
   */
  seek(filePath: string, params: SeekParams, options?: ChunkingOptions): Promise<SeekResult>;

  /**
   * Get chunk that contains a specific time
   * @param filePath - Path to the media file
   * @param time - Time in seconds
   * @param options - Chunking options
   * @returns Promise resolving to chunk metadata
   */
  getChunkAtTime(filePath: string, time: number, options?: ChunkingOptions): Promise<ChunkMetadata>;

  /**
   * Get chunks for a time range
   * @param filePath - Path to the media file
   * @param startTime - Start time in seconds
   * @param endTime - End time in seconds
   * @param options - Chunking options
   * @returns Promise resolving to array of chunk metadata
   */
  getChunksInRange(
    filePath: string,
    startTime: number,
    endTime: number,
    options?: ChunkingOptions
  ): Promise<ChunkMetadata[]>;
}

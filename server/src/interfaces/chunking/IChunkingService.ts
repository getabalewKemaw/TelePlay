/**
 * Chunking Service Interface
 * Main service interface for media chunking operations
 */



import type { ChunkMetadata,
  ChunkingOptions } from '../../types/chunking/ChunkingTypes.js';


/**
 * Main chunking service interface
 * Provides operations for time-based media chunking
 */
export interface IChunkingService {
  /**
   * Get all chunks for a media file
   * @param filePath - Path to the media file
   * @param options - Chunking options
   * @returns Promise resolving to array of chunk metadata
   */
  getAllChunks(filePath: string, options?: ChunkingOptions): Promise<ChunkMetadata[]>;

  /**
   * Get chunk that contains a specific time
   * @param filePath - Path to the media file
   * @param time - Time in seconds
   * @param options - Chunking options
   * @returns Promise resolving to chunk metadata
   */
  getChunkAtTime(filePath: string, time: number, options?: ChunkingOptions): Promise<ChunkMetadata>;
}

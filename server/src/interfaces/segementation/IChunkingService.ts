/**
 * Chunking Service Interface (for dependency injection)
 * Re-exported from chunking service to avoid circular dependencies
 */


import type { ChunkMetadata,ChunkingResult } from '../../types/chunking/ChunkingTypes.js';
/**
 * Minimal interface for chunking service
 * Used by segmentation service to get chunks
 */
export interface IChunkingService {
  /**
   * Get all chunks for a media file
   */
  getAllChunks(filePath: string, options?: any): Promise<ChunkMetadata[]>;

  /**
   * Generate chunks for a media file
   */
  generateChunks(filePath: string, options?: any): Promise<ChunkingResult>;
}

/**
 * Chunking Service Interface (for dependency injection)
 */


import type { ChunkMetadata } from '../../types/chunking/ChunkingTypes.js';

export interface IChunkingService {
  getAllChunks(filePath: string, options?: any): Promise<ChunkMetadata[]>;
  getChunkAtTime(filePath: string, time: number, options?: any): Promise<ChunkMetadata>;
}

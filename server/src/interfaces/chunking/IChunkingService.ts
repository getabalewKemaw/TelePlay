
import type { ChunkMetadata,
  ChunkingOptions } from '../../types/chunking/ChunkingTypes.js';
export interface IChunkingService {
  getAllChunks(filePath: string, options?: ChunkingOptions): Promise<ChunkMetadata[]>;
  // getChunkAtTime(filePath: string, time: number, options?: ChunkingOptions): Promise<ChunkMetadata>;
}

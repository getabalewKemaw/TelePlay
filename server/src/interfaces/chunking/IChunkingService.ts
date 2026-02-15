
import type { ChunkMetadata,
  ChunkingOptions,
  MediaMetadata } from '../../types/chunking/ChunkingTypes.js';
export interface IChunkingService {
  getAllChunks(filePath: string, options?: ChunkingOptions): Promise<ChunkMetadata[]>;
  getChunkAtTime(filePath: string, time: number, options?: ChunkingOptions): Promise<ChunkMetadata>;
  getMetadata(filePath: string): Promise<MediaMetadata>;
}

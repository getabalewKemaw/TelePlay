
import type { ChunkMetadata } from '../types/chunking/ChunkingTypes.js';
export interface ChunkListResponse {
    totalChunks: number;
    chunks: ChunkMetadata[];
}

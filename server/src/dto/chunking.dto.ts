
import type { ChunkMetadata } from '../types/chunking/ChunkingTypes.js';

export interface ChunkAccessRequestDto {
    filePath: string;
}

export interface ChunkAtTimeRequestDto {
    filePath: string;
    time: number;
}

export interface ChunkListResponse {
    totalChunks: number;
    chunks: ChunkMetadata[];
}

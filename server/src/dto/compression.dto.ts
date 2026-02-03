
import type { CompressionResult } from '../types/compression/CompressionTypes.js';

export interface CompressRequestDto {
    inputPath: string;
    options?: {
        level?: 'low' | 'medium' | 'high';
        preset?: string;
        targetBitrate?: number;
    };
}

export interface CompressionResponse {
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    outputPath: string;
    details: CompressionResult;
}


import type { CompressionResult } from '../types/compression/CompressionTypes.js';

export interface CompressRequestDto {
    inputPath: string;
    options?: {
        level?: 'low' | 'medium' | 'high';
        preset?: string;
        targetBitrate?: number;
    };
}



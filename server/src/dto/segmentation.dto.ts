
import type { SegmentMetadata } from '../types/segmentation/SegmentationTypes.js';

export interface SegmentationRequestDto {
    filePath: string;
}

export interface SegmentRangeRequestDto {
    filePath: string;
    startTime: number;
    endTime: number;
}

export interface SegmentationResponse {
    segments: SegmentMetadata[];
    count: number;
}

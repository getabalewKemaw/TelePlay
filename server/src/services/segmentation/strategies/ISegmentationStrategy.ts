
import type { ChunkMetadata } from '../../../types/chunking/ChunkingTypes.js';
import type { SegmentMetadata, SegmentationConfig } from '../../../types/segmentation/SegmentationTypes.js';
export interface ISegmentationStrategy {
  createSegments(chunks: ChunkMetadata[], config: SegmentationConfig): SegmentMetadata[];
  getName(): string;
}

import type { ChunkMetadata } from '../chunking/ChunkingTypes.js';
export interface SegmentMetadata {
  index: number;
  startTime: number;
  endTime: number;
  duration: number;
  chunks: ChunkMetadata[];
  chunkCount: number;
  estimatedSize?: number;
  priority: number;
  isCritical: boolean;
  sequence: number;
}
export type SegmentationStrategy = 'fixed' | 'adaptive' | 'progressive' | 'low-latency';
export interface SegmentationConfig {
  strategy: SegmentationStrategy;
  chunksPerSegment?: number;
  targetSegmentDuration?: number;
  minSegmentDuration?: number;
  maxSegmentDuration?: number;
  initialSegmentMultiplier?: number;
  optimizeForLowLatency?: boolean;
  bufferSize?: number;
}
export interface SegmentationResult {
  segments: SegmentMetadata[];
  totalSegments: number;
  totalDuration: number;
  averageSegmentDuration: number;
  firstSegmentDuration: number;
  config: SegmentationConfig;
}
export enum SegmentPriority {
  CRITICAL = 100,    // must load first (initial segments)
  HIGH = 75,         // load soon (next segments)
  MEDIUM = 50,       // preload (upcoming segments)
  LOW = 25,          // Load later (future segments)
  BACKGROUND = 10    // Load when idle (distant segments)
}

export interface SegmentationOptions {
  strategy?: SegmentationStrategy;
  chunksPerSegment?: number;
  targetSegmentDuration?: number;
  optimizeForLowLatency?: boolean;
  baseChunkDuration?: number;

}

/**
 * Progressive Segmentation Strategy
 * Creates segments with increasing sizes (small initial, larger later)
 * Optimized for progressive playback and low initial latency
 */
import type { ISegmentationStrategy } from './ISegmentationStrategy.js';
import type { ChunkMetadata } from '../../../types/chunking/ChunkingTypes.js';
import type { SegmentMetadata, SegmentationConfig } from '../../../types/segmentation/SegmentationTypes.js';
import { SegmentPriority } from '../../../types/segmentation/SegmentationTypes.js';
export const createProgressiveSegmentationStrategy = (): ISegmentationStrategy => {
  const getName = (): string => 'progressive';

  const createSegments = (chunks: ChunkMetadata[], config: SegmentationConfig): SegmentMetadata[] => {
    if (chunks.length === 0) {
      return [];
    }
    const baseChunksPerSegment = config.chunksPerSegment ?? 5;
    const initialMultiplier = config.initialSegmentMultiplier ?? 0.5;
    const optimizeForLowLatency = config.optimizeForLowLatency ?? true;
    const segments: SegmentMetadata[] = [];
    let chunkIndex = 0;
    let segmentIndex = 0;
    while (chunkIndex < chunks.length) {
      const multiplier = segmentIndex === 0
        ? initialMultiplier
        : 1 + (segmentIndex * 0.1); // gradually  increase

      const chunksForSegment = Math.max(
        1,
        Math.floor(baseChunksPerSegment * multiplier)
      );

      const segmentChunks = chunks.slice(
        chunkIndex,
        Math.min(chunkIndex + chunksForSegment, chunks.length)
      );

      if (segmentChunks.length === 0) {
        break;
      }

      const startTime = segmentChunks[0]!.startTime;
      const endTime = segmentChunks[segmentChunks.length - 1]!.endTime;
      const duration = endTime - startTime;
      const isCritical = optimizeForLowLatency && segmentIndex === 0;

      let priority: SegmentPriority;
      if (isCritical) {
        priority = SegmentPriority.CRITICAL;
      } else if (segmentIndex < 2) {
        priority = SegmentPriority.HIGH;
      } else if (segmentIndex < 5) {
        priority = SegmentPriority.MEDIUM;
      } else {
        priority = SegmentPriority.LOW;
      }
      const segment: SegmentMetadata = {
        index: segmentIndex,
        startTime,
        endTime,
        duration,
        chunks: segmentChunks,
        chunkCount: segmentChunks.length,
        priority,
        isCritical,
        sequence: segmentIndex
      };

      segments.push(segment);
      chunkIndex += segmentChunks.length;
      segmentIndex++;
    }

    return segments;
  };

  return {
    getName,
    createSegments
  };
};

export type ProgressiveSegmentationStrategy = ReturnType<typeof createProgressiveSegmentationStrategy>;

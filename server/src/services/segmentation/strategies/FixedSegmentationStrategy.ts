/**
 * Fixed Segmentation Strategy
 * Groups chunks into segments with a fixed number of chunks per segment
 */

import type { ISegmentationStrategy } from './ISegmentationStrategy.js';
import type { ChunkMetadata } from '../../../types/chunking/ChunkingTypes.js';
import type { SegmentMetadata, SegmentationConfig } from '../../../types/segmentation/SegmentationTypes.js';
import { SegmentPriority } from '../../../types/segmentation/SegmentationTypes.js';

/**
 * Fixed segmentation strategy
 * Divides chunks into segments with a fixed number of chunks per segment
 */
export class FixedSegmentationStrategy implements ISegmentationStrategy {
  getName(): string {
    return 'fixed';
  }

  createSegments(chunks: ChunkMetadata[], config: SegmentationConfig): SegmentMetadata[] {
    if (chunks.length === 0) {
      return [];
    }

    const chunksPerSegment = config.chunksPerSegment ?? 5;
    const segments: SegmentMetadata[] = [];
    const optimizeForLowLatency = config.optimizeForLowLatency ?? true;

    for (let i = 0; i < chunks.length; i += chunksPerSegment) {
      const segmentChunks = chunks.slice(i, i + chunksPerSegment);
      const startTime = segmentChunks[0]!.startTime;
      const endTime = segmentChunks[segmentChunks.length - 1]!.endTime;
      const duration = endTime - startTime;

      const segmentIndex = segments.length;
      const isCritical = optimizeForLowLatency && segmentIndex === 0;

      // Calculate priority: first segments are critical, then high, then medium, then low
      let priority: SegmentPriority;
      if (isCritical) {
        priority = SegmentPriority.CRITICAL;
      } else if (segmentIndex < 3) {
        priority = SegmentPriority.HIGH;
      } else if (segmentIndex < 10) {
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
    }

    return segments;
  }
}

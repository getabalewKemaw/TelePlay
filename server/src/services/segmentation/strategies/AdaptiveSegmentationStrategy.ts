/**
 * Adaptive Segmentation Strategy
 * Creates segments with variable sizes based on target duration
 */

import type { ISegmentationStrategy } from './ISegmentationStrategy.js';
import type { ChunkMetadata } from '../../chunking/types/ChunkingTypes.js';
import type { SegmentMetadata, SegmentationConfig } from '../types/SegmentationTypes.js';
import { SegmentPriority } from '../types/SegmentationTypes.js';

/**
 * Adaptive segmentation strategy
 * Groups chunks to achieve target segment duration
 */
export class AdaptiveSegmentationStrategy implements ISegmentationStrategy {
  getName(): string {
    return 'adaptive';
  }

  createSegments(chunks: ChunkMetadata[], config: SegmentationConfig): SegmentMetadata[] {
    if (chunks.length === 0) {
      return [];
    }

    const targetDuration = config.targetSegmentDuration ?? 10;
    const minDuration = config.minSegmentDuration ?? 2;
    const maxDuration = config.maxSegmentDuration ?? 30;
    const optimizeForLowLatency = config.optimizeForLowLatency ?? true;

    const segments: SegmentMetadata[] = [];
    let currentChunks: ChunkMetadata[] = [];
    let currentStartTime = chunks[0].startTime;
    let currentDuration = 0;
    let segmentIndex = 0;

    for (const chunk of chunks) {
      const chunkDuration = chunk.duration;
      const newDuration = currentDuration + chunkDuration;

      // Check if adding this chunk would exceed max duration
      if (newDuration > maxDuration && currentChunks.length > 0) {
        // Create segment from current chunks
        segments.push(this.createSegment(
          segmentIndex++,
          currentChunks,
          currentStartTime,
          optimizeForLowLatency
        ));

        // Start new segment
        currentChunks = [chunk];
        currentStartTime = chunk.startTime;
        currentDuration = chunkDuration;
      } else if (newDuration >= targetDuration || newDuration >= minDuration) {
        // Add chunk and create segment if we've reached target or minimum
        currentChunks.push(chunk);
        currentDuration = newDuration;

        segments.push(this.createSegment(
          segmentIndex++,
          currentChunks,
          currentStartTime,
          optimizeForLowLatency
        ));

        // Reset for next segment
        currentChunks = [];
        currentDuration = 0;
      } else {
        // Add chunk to current segment
        currentChunks.push(chunk);
        currentDuration = newDuration;
      }
    }

    // Add remaining chunks as final segment
    if (currentChunks.length > 0) {
      segments.push(this.createSegment(
        segmentIndex,
        currentChunks,
        currentStartTime,
        optimizeForLowLatency
      ));
    }

    return segments;
  }

  private createSegment(
    index: number,
    chunks: ChunkMetadata[],
    startTime: number,
    optimizeForLowLatency: boolean
  ): SegmentMetadata {
    const endTime = chunks[chunks.length - 1].endTime;
    const duration = endTime - startTime;
    const isCritical = optimizeForLowLatency && index === 0;

    let priority: SegmentPriority;
    if (isCritical) {
      priority = SegmentPriority.CRITICAL;
    } else if (index < 3) {
      priority = SegmentPriority.HIGH;
    } else if (index < 10) {
      priority = SegmentPriority.MEDIUM;
    } else {
      priority = SegmentPriority.LOW;
    }

    return {
      index,
      startTime,
      endTime,
      duration,
      chunks,
      chunkCount: chunks.length,
      priority,
      isCritical,
      sequence: index
    };
  }
}

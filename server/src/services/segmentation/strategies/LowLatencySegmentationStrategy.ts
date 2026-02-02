/**
 * Low-Latency Segmentation Strategy
 * Creates small initial segments for fast playback start
 * Optimized for minimal time-to-first-frame
 */

import type { ISegmentationStrategy } from './ISegmentationStrategy.js';
import type { ChunkMetadata } from '../../../types/chunking/ChunkingTypes.js';
import type { SegmentMetadata, SegmentationConfig } from '../../../types/segementation/SegmentationTypes.js';
import { SegmentPriority } from '../../../types/segementation/SegmentationTypes.js';

/**
 * Low-latency segmentation strategy
 * Creates very small initial segments for fast start, then normal segments
 */
export class LowLatencySegmentationStrategy implements ISegmentationStrategy {
  getName(): string {
    return 'low-latency';
  }

  createSegments(chunks: ChunkMetadata[], config: SegmentationConfig): SegmentMetadata[] {
    if (chunks.length === 0) {
      return [];
    }

    const targetDuration = config.targetSegmentDuration ?? 5; // Small segments
    const minDuration = config.minSegmentDuration ?? 1; // Very small minimum
    const maxDuration = config.maxSegmentDuration ?? 10;
    const optimizeForLowLatency = true; // Always true for this strategy

    const segments: SegmentMetadata[] = [];
    let currentChunks: ChunkMetadata[] = [];
    let currentStartTime = chunks[0]!.startTime;
    let currentDuration = 0;
    let segmentIndex = 0;

    for (const chunk of chunks) {
      const chunkDuration = chunk.duration;
      const newDuration = currentDuration + chunkDuration;

      // For first segment, use even smaller size
      const effectiveTarget = segmentIndex === 0
        ? targetDuration * 0.5
        : targetDuration;

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
      } else if (newDuration >= effectiveTarget || newDuration >= minDuration) {
        // Add chunk and create segment
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
    const endTime = chunks[chunks.length - 1]!.endTime;
    const duration = endTime - startTime;
    const isCritical = index < 3; // First 3 segments are critical

    let priority: SegmentPriority;
    if (index === 0) {
      priority = SegmentPriority.CRITICAL;
    } else if (index < 3) {
      priority = SegmentPriority.HIGH;
    } else if (index < 8) {
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

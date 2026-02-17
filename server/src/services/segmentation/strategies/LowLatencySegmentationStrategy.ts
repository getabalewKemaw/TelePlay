/**
 * Low-Latency Segmentation Strategy
 * Creates small initial segments for fast playback start
 * Optimized for minimal time-to-first-frame
 */
import type { ISegmentationStrategy } from './ISegmentationStrategy.js';
import type { ChunkMetadata } from '../../../types/chunking/ChunkingTypes.js';
import type { SegmentMetadata, SegmentationConfig } from '../../../types/segmentation/SegmentationTypes.js';
import { SegmentPriority } from '../../../types/segmentation/SegmentationTypes.js';
export const createLowLatencySegmentationStrategy = (): ISegmentationStrategy => {
  const getName = (): string => 'low-latency';

  const createSegment = (
    index: number,
    chunks: ChunkMetadata[],
    startTime: number
  ): SegmentMetadata => {
    const endTime = chunks[chunks.length - 1]!.endTime;
    const duration = endTime - startTime;
    const isCritical = index < 3; 

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
  };

  const createSegments = (chunks: ChunkMetadata[], config: SegmentationConfig): SegmentMetadata[] => {
    if (chunks.length === 0) {
      return [];
    }
    const targetDuration = config.targetSegmentDuration ?? 5;
    const minDuration = config.minSegmentDuration ?? 1; 
    const maxDuration = config.maxSegmentDuration ?? 10;
    const segments: SegmentMetadata[] = [];
    let currentChunks: ChunkMetadata[] = [];
    let currentStartTime = chunks[0]!.startTime;
    let currentDuration = 0;
    let segmentIndex = 0;
    for (const chunk of chunks) {
      const chunkDuration = chunk.duration;
      const newDuration = currentDuration + chunkDuration;
      // for first segment, use even smaller size
      const effectiveTarget = segmentIndex === 0
        ? targetDuration * 0.5
        : targetDuration;

      // Check if adding this chunk would exceed max duration
      if (newDuration > maxDuration && currentChunks.length > 0) {
        // Create segment from current chunks
        segments.push(createSegment(
          segmentIndex++,
          currentChunks,
          currentStartTime
        ));

        // Start new segment
        currentChunks = [chunk];
        currentStartTime = chunk.startTime;
        currentDuration = chunkDuration;
      } else {
        currentChunks.push(chunk);
        currentDuration = newDuration;

        if (currentDuration >= effectiveTarget && currentDuration >= minDuration) {
          segments.push(createSegment(
            segmentIndex++,
            currentChunks,
            currentStartTime
          ));
          currentChunks = [];
          currentDuration = 0;
        }
      }
    }

    // add remaining chunks as final segment
    if (currentChunks.length > 0) {
      segments.push(createSegment(
        segmentIndex,
        currentChunks,
        currentStartTime
      ));
    }

    return segments;
  };

  return {
    getName,
    createSegments
  };
};

export type LowLatencySegmentationStrategy = ReturnType<typeof createLowLatencySegmentationStrategy>;

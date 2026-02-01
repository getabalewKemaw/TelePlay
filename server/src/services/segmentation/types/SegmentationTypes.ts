/**
 * Segmentation Service Types
 * Type definitions for media segmentation operations
 */

import type { ChunkMetadata } from '../../chunking/types/ChunkingTypes.js';

/**
 * Segment metadata for a single streaming segment
 */
export interface SegmentMetadata {
  /**
   * Zero-based index of the segment
   */
  index: number;

  /**
   * Start time of the segment in seconds
   */
  startTime: number;

  /**
   * End time of the segment in seconds (exclusive)
   */
  endTime: number;

  /**
   * Duration of the segment in seconds
   */
  duration: number;

  /**
   * Chunks contained in this segment
   */
  chunks: ChunkMetadata[];

  /**
   * Number of chunks in this segment
   */
  chunkCount: number;

  /**
   * Estimated size of the segment in bytes (if available)
   */
  estimatedSize?: number;

  /**
   * Priority for loading (higher = load first)
   * Used for adaptive buffering
   */
  priority: number;

  /**
   * Whether this segment is critical for playback start
   */
  isCritical: boolean;

  /**
   * Sequence number for streaming order
   */
  sequence: number;
}

/**
 * Segmentation strategy type
 */
export type SegmentationStrategy = 'fixed' | 'adaptive' | 'progressive' | 'low-latency';

/**
 * Segmentation configuration
 */
export interface SegmentationConfig {
  /**
   * Segmentation strategy to use
   * - 'fixed': Fixed number of chunks per segment
   * - 'adaptive': Variable chunks based on content
   * - 'progressive': Increasing segment sizes
   * - 'low-latency': Small segments for fast start
   */
  strategy: SegmentationStrategy;

  /**
   * Number of chunks per segment (for 'fixed' strategy)
   * Default: 5
   */
  chunksPerSegment?: number;

  /**
   * Target segment duration in seconds (for adaptive strategies)
   * Default: 10
   */
  targetSegmentDuration?: number;

  /**
   * Minimum segment duration in seconds
   * Default: 2
   */
  minSegmentDuration?: number;

  /**
   * Maximum segment duration in seconds
   * Default: 30
   */
  maxSegmentDuration?: number;

  /**
   * Initial segment size multiplier (for 'progressive' strategy)
   * First segment will be smaller for faster start
   * Default: 0.5
   */
  initialSegmentMultiplier?: number;

  /**
   * Whether to optimize for low-latency streaming
   * When true, prioritizes smaller initial segments
   * Default: true
   */
  optimizeForLowLatency?: boolean;

  /**
   * Buffer size in seconds for progressive playback
   * Default: 5
   */
  bufferSize?: number;
}

/**
 * Segmentation result
 */
export interface SegmentationResult {
  /**
   * Array of segment metadata, sorted by index
   */
  segments: SegmentMetadata[];

  /**
   * Total number of segments
   */
  totalSegments: number;

  /**
   * Total duration of the media in seconds
   */
  totalDuration: number;

  /**
   * Average segment duration in seconds
   */
  averageSegmentDuration: number;

  /**
   * Duration of the first segment (for low-latency optimization)
   */
  firstSegmentDuration: number;

  /**
   * Configuration used for segmentation
   */
  config: SegmentationConfig;
}

/**
 * Buffering strategy configuration
 */
export interface BufferingStrategy {
  /**
   * Initial buffer size in seconds
   * How much content to buffer before starting playback
   */
  initialBufferSize: number;

  /**
   * Minimum buffer size in seconds
   * Playback pauses if buffer falls below this
   */
  minBufferSize: number;

  /**
   * Maximum buffer size in seconds
   * Stop buffering if buffer exceeds this
   */
  maxBufferSize: number;

  /**
   * Target buffer size in seconds
   * Try to maintain this buffer level
   */
  targetBufferSize: number;
}

/**
 * Playback state for adaptive buffering
 */
export interface PlaybackState {
  /**
   * Current playback position in seconds
   */
  currentTime: number;

  /**
   * Current buffer level in seconds
   */
  bufferLevel: number;

  /**
   * Network bandwidth estimate in bytes per second
   */
  bandwidth?: number;

  /**
   * Whether playback is currently playing
   */
  isPlaying: boolean;
}

/**
 * Adaptive buffering recommendation
 */
export interface BufferingRecommendation {
  /**
   * Segments to load immediately (high priority)
   */
  immediate: SegmentMetadata[];

  /**
   * Segments to preload (medium priority)
   */
  preload: SegmentMetadata[];

  /**
   * Segments that can be loaded later (low priority)
   */
  deferred: SegmentMetadata[];

  /**
   * Recommended buffer size in seconds
   */
  recommendedBufferSize: number;
}

/**
 * Streaming mode
 */
export type StreamingMode = 'file-based' | 'live';

/**
 * Segment loading priority
 */
export enum SegmentPriority {
  CRITICAL = 100,    // Must load first (initial segments)
  HIGH = 75,         // Load soon (next segments)
  MEDIUM = 50,       // Preload (upcoming segments)
  LOW = 25,          // Load later (future segments)
  BACKGROUND = 10    // Load when idle (distant segments)
}

/**
 * Segmentation options
 */
export interface SegmentationOptions {
  /**
   * Segmentation strategy
   */
  strategy?: SegmentationStrategy;

  /**
   * Chunks per segment (for fixed strategy)
   */
  chunksPerSegment?: number;

  /**
   * Target segment duration (for adaptive strategies)
   */
  targetSegmentDuration?: number;

  /**
   * Optimize for low latency
   */
  optimizeForLowLatency?: boolean;

  /**
   * Streaming mode
   */
  mode?: StreamingMode;
}

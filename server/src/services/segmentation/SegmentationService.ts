/**
 * Segmentation Service – Streaming Optimization Layer
 * Groups time-based chunks into logical segments for efficient network delivery
 */

import type { ISegmentationService } from '../../interfaces/segementation/ISegmentationService.js';
import type { IChunkingService } from '../../interfaces/segementation/IChunkingService.js';
import type {
  SegmentationResult,
  SegmentMetadata,
  SegmentationOptions,
  SegmentationConfig,
  BufferingStrategy,
  PlaybackState,
  BufferingRecommendation,
  SegmentationStrategy
} from '../../types/segementation/SegmentationTypes.js';
import { SegmentationStrategyFactory } from './strategies/SegmentationStrategyFactory.js';
import { SegmentationValidationError, SegmentationBufferingError } from '../../errors/segmentation/SegmentationErrors.js';
import { SegmentPriority } from '../../types/segementation/SegmentationTypes.js';

/**
 * Default segmentation configuration
 */
const DEFAULT_CONFIG: SegmentationConfig = {
  strategy: 'adaptive',
  chunksPerSegment: 5,
  targetSegmentDuration: 10,
  minSegmentDuration: 2,
  maxSegmentDuration: 30,
  initialSegmentMultiplier: 0.5,
  optimizeForLowLatency: true,
  bufferSize: 5
};

/**
 * Segmentation Service Implementation
 * 
 * Responsibilities:
 * - Group chunks into streaming segments
 * - Optimize for low-latency streaming
 * - Support progressive playback
 * - Enable adaptive buffering
 * - Codec and transport independent
 */
export class SegmentationService implements ISegmentationService {
  private readonly chunkingService: IChunkingService;
  private readonly defaultConfig: SegmentationConfig;

  /**
   * Constructor with dependency injection
   * @param chunkingService - Chunking service instance
   * @param defaultConfig - Default segmentation configuration
   */
  constructor(
    chunkingService: IChunkingService,
    defaultConfig?: Partial<SegmentationConfig>
  ) {
    this.chunkingService = chunkingService;
    this.defaultConfig = { ...DEFAULT_CONFIG, ...defaultConfig };
  }

  /**
   * Create segments from chunks for a media file
   */
  async createSegments(
    filePath: string,
    options?: SegmentationOptions
  ): Promise<SegmentationResult> {
    // Get chunks from chunking service
    const chunks = await this.chunkingService.getAllChunks(filePath);

    if (chunks.length === 0) {
      throw new SegmentationValidationError(
        'No chunks available for segmentation',
        'chunks'
      );
    }

    // Build configuration from options
    const config = this.buildConfig(options);

    // Validate configuration
    this.validateConfig(config);

    // Get appropriate strategy
    const strategy = SegmentationStrategyFactory.create(config.strategy);

    // Create segments using strategy
    const segments = strategy.createSegments(chunks, config);

    // Calculate statistics
    const totalDuration = chunks[chunks.length - 1].endTime;
    const averageDuration = segments.length > 0
      ? segments.reduce((sum, s) => sum + s.duration, 0) / segments.length
      : 0;
    const firstSegmentDuration = segments.length > 0 ? segments[0].duration : 0;

    return {
      segments,
      totalSegments: segments.length,
      totalDuration,
      averageSegmentDuration: averageDuration,
      firstSegmentDuration,
      config
    };
  }

  /**
   * Get segment metadata for a specific segment index
   */
  async getSegment(
    filePath: string,
    segmentIndex: number,
    options?: SegmentationOptions
  ): Promise<SegmentMetadata> {
    const result = await this.createSegments(filePath, options);

    if (segmentIndex < 0 || segmentIndex >= result.segments.length) {
      throw new SegmentationValidationError(
        `Segment index ${segmentIndex} is out of range. Valid range: 0-${result.segments.length - 1}`,
        'segmentIndex'
      );
    }

    return result.segments[segmentIndex];
  }

  /**
   * Get all segments for a media file
   */
  async getAllSegments(
    filePath: string,
    options?: SegmentationOptions
  ): Promise<SegmentMetadata[]> {
    const result = await this.createSegments(filePath, options);
    return result.segments;
  }

  /**
   * Get segments for a time range
   */
  async getSegmentsInRange(
    filePath: string,
    startTime: number,
    endTime: number,
    options?: SegmentationOptions
  ): Promise<SegmentMetadata[]> {
    if (startTime < 0 || startTime >= endTime) {
      throw new SegmentationValidationError(
        `Invalid time range: ${startTime}s - ${endTime}s`,
        'timeRange'
      );
    }

    const segments = await this.getAllSegments(filePath, options);

    // Find segments that overlap with the range
    return segments.filter(segment => {
      return (
        (segment.startTime >= startTime && segment.startTime < endTime) ||
        (segment.endTime > startTime && segment.endTime <= endTime) ||
        (segment.startTime <= startTime && segment.endTime >= endTime)
      );
    });
  }

  /**
   * Get adaptive buffering recommendation
   */
  async getBufferingRecommendation(
    filePath: string,
    playbackState: PlaybackState,
    bufferingStrategy: BufferingStrategy,
    options?: SegmentationOptions
  ): Promise<BufferingRecommendation> {
    const segments = await this.getAllSegments(filePath, options);

    // Validate playback state
    if (playbackState.currentTime < 0) {
      throw new SegmentationValidationError(
        'Current time must be non-negative',
        'currentTime'
      );
    }

    // Find current segment
    const currentSegment = this.findSegmentAtTime(segments, playbackState.currentTime);

    if (!currentSegment) {
      throw new SegmentationBufferingError(
        `Could not find segment for time ${playbackState.currentTime}s`,
        playbackState.bufferLevel
      );
    }

    // Calculate buffer needs
    const bufferDeficit = bufferingStrategy.targetBufferSize - playbackState.bufferLevel;
    const needsBuffering = bufferDeficit > 0;

    // Categorize segments based on priority and buffer needs
    const immediate: SegmentMetadata[] = [];
    const preload: SegmentMetadata[] = [];
    const deferred: SegmentMetadata[] = [];

    for (const segment of segments) {
      // Current and next segments are immediate
      if (segment.index <= currentSegment.index + 1) {
        immediate.push(segment);
      }
      // Segments within target buffer are preload
      else if (
        segment.startTime <= playbackState.currentTime + bufferingStrategy.targetBufferSize
      ) {
        preload.push(segment);
      }
      // Everything else is deferred
      else {
        deferred.push(segment);
      }
    }

    // Adjust based on network conditions
    if (playbackState.bandwidth && playbackState.bandwidth < 1000000) {
      // Low bandwidth: reduce preload
      const reducedPreload = preload.slice(0, Math.floor(preload.length * 0.5));
      deferred.push(...preload.slice(reducedPreload.length));
      preload.length = 0;
      preload.push(...reducedPreload);
    }

    // Calculate recommended buffer size
    const immediateDuration = immediate.reduce((sum, s) => sum + s.duration, 0);
    const preloadDuration = preload.reduce((sum, s) => sum + s.duration, 0);
    const recommendedBufferSize = Math.min(
      immediateDuration + preloadDuration,
      bufferingStrategy.maxBufferSize
    );

    return {
      immediate,
      preload,
      deferred,
      recommendedBufferSize
    };
  }

  /**
   * Get initial segments for playback start (low-latency optimization)
   */
  async getInitialSegments(
    filePath: string,
    options?: SegmentationOptions
  ): Promise<SegmentMetadata[]> {
    const segments = await this.getAllSegments(filePath, options);

    // Return critical segments (first few segments)
    return segments.filter(segment => segment.isCritical || segment.priority >= SegmentPriority.HIGH);
  }

  /**
   * Find segment at a specific time
   */
  private findSegmentAtTime(
    segments: SegmentMetadata[],
    time: number
  ): SegmentMetadata | null {
    // Binary search for efficiency
    let left = 0;
    let right = segments.length - 1;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const segment = segments[mid];

      if (time >= segment.startTime && time < segment.endTime) {
        return segment;
      }

      if (time < segment.startTime) {
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    }

    // Return nearest segment
    if (left > 0 && left <= segments.length) {
      return segments[left - 1];
    }
    if (right >= 0 && right < segments.length) {
      return segments[right];
    }

    return segments[0] || null;
  }

  /**
   * Build configuration from options
   */
  private buildConfig(options?: SegmentationOptions): SegmentationConfig {
    return {
      strategy: options?.strategy ?? this.defaultConfig.strategy,
      chunksPerSegment: options?.chunksPerSegment ?? this.defaultConfig.chunksPerSegment,
      targetSegmentDuration: options?.targetSegmentDuration ?? this.defaultConfig.targetSegmentDuration,
      minSegmentDuration: this.defaultConfig.minSegmentDuration,
      maxSegmentDuration: this.defaultConfig.maxSegmentDuration,
      initialSegmentMultiplier: this.defaultConfig.initialSegmentMultiplier,
      optimizeForLowLatency: options?.optimizeForLowLatency ?? this.defaultConfig.optimizeForLowLatency,
      bufferSize: this.defaultConfig.bufferSize
    };
  }

  /**
   * Validate configuration
   */
  private validateConfig(config: SegmentationConfig): void {
    if (config.chunksPerSegment && config.chunksPerSegment <= 0) {
      throw new SegmentationValidationError(
        `Chunks per segment must be greater than 0, got ${config.chunksPerSegment}`,
        'chunksPerSegment'
      );
    }

    if (config.targetSegmentDuration && config.targetSegmentDuration <= 0) {
      throw new SegmentationValidationError(
        `Target segment duration must be greater than 0, got ${config.targetSegmentDuration}`,
        'targetSegmentDuration'
      );
    }

    if (config.minSegmentDuration && config.minSegmentDuration <= 0) {
      throw new SegmentationValidationError(
        `Minimum segment duration must be greater than 0, got ${config.minSegmentDuration}`,
        'minSegmentDuration'
      );
    }

    if (
      config.minSegmentDuration &&
      config.maxSegmentDuration &&
      config.minSegmentDuration > config.maxSegmentDuration
    ) {
      throw new SegmentationValidationError(
        `Minimum segment duration (${config.minSegmentDuration}s) cannot be greater than maximum (${config.maxSegmentDuration}s)`,
        'segmentDuration'
      );
    }
  }
}

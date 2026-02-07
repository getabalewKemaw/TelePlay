/**
 * Segmentation Service – Streaming Optimization Layer
 * Groups time-based chunks into logical segments for efficient network delivery
 */

import type { ISegmentationService } from '../../interfaces/segmentation/ISegmentationService.js';
import type { IChunkingService } from '../../interfaces/chunking/IChunkingService.js';
import type {
  SegmentationResult,
  SegmentMetadata,
  SegmentationOptions,
  SegmentationConfig,
} from '../../types/segmentation/SegmentationTypes.js';
import { SegmentationStrategyFactory } from './strategies/SegmentationStrategyFactory.js';
import { SegmentationValidationError } from '../../errors/segmentation/SegmentationErrors.js';
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

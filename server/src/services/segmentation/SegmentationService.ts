/**
 * Segmentation Service - Streaming Optimization Layer
 * Groups time-based chunks into logical segments for efficient network delivery
 */

import type { ISegmentationService } from '../../interfaces/segmentation/ISegmentationService.js';
import type { IChunkingService } from '../../interfaces/chunking/IChunkingService.js';
import type {
  SegmentMetadata,
  SegmentationOptions,
  SegmentationConfig,
} from '../../types/segmentation/SegmentationTypes.js';
import { SegmentationStrategyFactory } from './strategies/SegmentationStrategyFactory.js';
import { SegmentationValidationError } from '../../errors/segmentation/SegmentationErrors.js';
import { ChunkingService } from '../chunking/ChunkingService.js';

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

const DEFAULT_BASE_CHUNK_DURATION = 10;

export class SegmentationService implements ISegmentationService {
  private readonly chunkingService: IChunkingService;
  private readonly defaultConfig: SegmentationConfig;

  constructor(
    chunkingService?: IChunkingService,
    defaultConfig: SegmentationConfig = DEFAULT_CONFIG
  ) {
    this.chunkingService = chunkingService ?? new ChunkingService();
    this.defaultConfig = defaultConfig;
  }

  async getAllSegments(filePath: string, options?: SegmentationOptions): Promise<SegmentMetadata[]> {
    const config = this.buildConfig(options);
    this.validateConfig(config);

    const chunks = await this.chunkingService.getAllChunks(filePath, {
      chunkDuration: options?.baseChunkDuration ?? DEFAULT_BASE_CHUNK_DURATION
    });
    const strategy = SegmentationStrategyFactory.create(config.strategy);
    return strategy.createSegments(chunks, config);
  }

  async getSegmentsInRange(
    filePath: string,
    startTime: number,
    endTime: number,
    options?: SegmentationOptions
  ): Promise<SegmentMetadata[]> {
    if (Number.isNaN(startTime) || Number.isNaN(endTime) || startTime < 0 || endTime < startTime) {
      throw new SegmentationValidationError(
        `Invalid segment range: start=${startTime}, end=${endTime}`,
        'timeRange'
      );
    }

    const segments = await this.getAllSegments(filePath, options);
    return segments.filter((segment) => (
      (segment.startTime >= startTime && segment.startTime < endTime) ||
      (segment.endTime > startTime && segment.endTime <= endTime) ||
      (segment.startTime <= startTime && segment.endTime >= endTime)
    ));
  }

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


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
import { createStrategy } from './strategies/SegmentationStrategyFactory.js';
import { segmentationValidationError } from '../../errors/segmentation/SegmentationErrors.js';
import { chunkingService } from '../chunking/ChunkingService.js';
import { isSegmentInRange, validateTimeRange } from '../../utils/segmentation/segmentationRangeUtils.js';

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

const chunking: IChunkingService = chunkingService;
const defaultConfig: SegmentationConfig = DEFAULT_CONFIG;

const buildConfig = (options?: SegmentationOptions): SegmentationConfig => {
  return {
    strategy: options?.strategy ?? defaultConfig.strategy,
    chunksPerSegment: options?.chunksPerSegment ?? defaultConfig.chunksPerSegment,
    targetSegmentDuration: options?.targetSegmentDuration ?? defaultConfig.targetSegmentDuration,
    minSegmentDuration: options?.minSegmentDuration ?? defaultConfig.minSegmentDuration,
    maxSegmentDuration: options?.maxSegmentDuration ?? defaultConfig.maxSegmentDuration,
    initialSegmentMultiplier: options?.initialSegmentMultiplier ?? defaultConfig.initialSegmentMultiplier,
    optimizeForLowLatency: options?.optimizeForLowLatency ?? defaultConfig.optimizeForLowLatency,
    bufferSize: options?.bufferSize ?? defaultConfig.bufferSize
  };
};

const validateConfig = (config: SegmentationConfig): void => {
  if (config.chunksPerSegment !== undefined && (!Number.isFinite(config.chunksPerSegment) || config.chunksPerSegment <= 0)) {
    throw segmentationValidationError(
      `Chunks per segment must be greater than 0, got ${config.chunksPerSegment}`,
      'chunksPerSegment'
    );
  }

  if (config.targetSegmentDuration !== undefined && (!Number.isFinite(config.targetSegmentDuration) || config.targetSegmentDuration <= 0)) {
    throw segmentationValidationError(
      `Target segment duration must be greater than 0, got ${config.targetSegmentDuration}`,
      'targetSegmentDuration'
    );
  }

  if (config.minSegmentDuration !== undefined && (!Number.isFinite(config.minSegmentDuration) || config.minSegmentDuration <= 0)) {
    throw segmentationValidationError(
      `Minimum segment duration must be greater than 0, got ${config.minSegmentDuration}`,
      'minSegmentDuration'
    );
  }

  if (
    config.minSegmentDuration &&
    config.maxSegmentDuration &&
    config.minSegmentDuration > config.maxSegmentDuration
  ) {
    throw segmentationValidationError(
      `Minimum segment duration (${config.minSegmentDuration}s) cannot be greater than maximum (${config.maxSegmentDuration}s)`,
      'segmentDuration'
    );
  }

  if (config.initialSegmentMultiplier !== undefined && (!Number.isFinite(config.initialSegmentMultiplier) || config.initialSegmentMultiplier <= 0)) {
    throw segmentationValidationError(
      `Initial segment multiplier must be greater than 0, got ${config.initialSegmentMultiplier}`,
      'initialSegmentMultiplier'
    );
  }

  if (config.bufferSize !== undefined && (!Number.isFinite(config.bufferSize) || config.bufferSize <= 0)) {
    throw segmentationValidationError(
      `Buffer size must be greater than 0, got ${config.bufferSize}`,
      'bufferSize'
    );
  }
};

export const getAllSegments = async (filePath: string, options?: SegmentationOptions): Promise<SegmentMetadata[]> => {
  if (!filePath) {
    throw segmentationValidationError('filePath is required', 'filePath');
  }

  const config = buildConfig(options);
  validateConfig(config);

  const chunks = await chunking.getAllChunks(filePath, {
    chunkDuration: options?.baseChunkDuration ?? DEFAULT_BASE_CHUNK_DURATION
  });
  const strategy = createStrategy(config.strategy);
  return strategy.createSegments(chunks, config);
};

export const getSegmentsInRange = async (
  filePath: string,
  startTime: number,
  endTime: number,
  options?: SegmentationOptions
): Promise<SegmentMetadata[]> => {
  validateTimeRange(startTime, endTime);
  const segments = await getAllSegments(filePath, options);
  return segments.filter((segment) => isSegmentInRange(segment, startTime, endTime));
};

export const segmentationService: ISegmentationService = {
  getAllSegments,
  getSegmentsInRange
};

export type SegmentationService = typeof segmentationService;

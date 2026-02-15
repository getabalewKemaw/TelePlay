import type { SegmentationOptions, SegmentationStrategy } from '../../types/segmentation/SegmentationTypes.js';
import { SegmentationValidationError } from '../../errors/segmentation/SegmentationErrors.js';

const STRATEGIES = new Set<SegmentationStrategy>(['fixed', 'adaptive', 'progressive', 'low-latency']);

type QueryShape = Record<string, unknown>;

function readQueryString(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return undefined;
}

function parseOptionalNumber(query: QueryShape, key: string, min?: number): number | undefined {
  const raw = readQueryString(query[key]);
  if (raw === undefined || raw === '') return undefined;
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    throw new SegmentationValidationError(`${key} must be a valid number`, key);
  }
  if (min !== undefined && value < min) {
    throw new SegmentationValidationError(`${key} must be >= ${min}`, key);
  }
  return value;
}

function parseOptionalBoolean(query: QueryShape, key: string): boolean | undefined {
  const raw = readQueryString(query[key]);
  if (raw === undefined || raw === '') return undefined;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  throw new SegmentationValidationError(`${key} must be true or false`, key);
}

export function getRequiredFilePath(query: QueryShape): string {
  const filePath = readQueryString(query.filePath);
  if (!filePath) {
    throw new SegmentationValidationError('filePath is required', 'filePath');
  }
  return filePath;
}

export function getRequiredRange(query: QueryShape): { startTime: number; endTime: number } {
  const startTime = parseOptionalNumber(query, 'startTime', 0);
  const endTime = parseOptionalNumber(query, 'endTime', 0);
  if (startTime === undefined || endTime === undefined) {
    throw new SegmentationValidationError('startTime and endTime are required', 'timeRange');
  }
  return { startTime, endTime };
}

export function parseSegmentationOptions(query: QueryShape): SegmentationOptions {
  const strategyRaw = readQueryString(query.strategy);
  if (strategyRaw && !STRATEGIES.has(strategyRaw as SegmentationStrategy)) {
    throw new SegmentationValidationError(`Unsupported strategy: ${strategyRaw}`, 'strategy');
  }

  return {
    strategy: strategyRaw as SegmentationStrategy | undefined,
    chunksPerSegment: parseOptionalNumber(query, 'chunksPerSegment', 1),
    targetSegmentDuration: parseOptionalNumber(query, 'targetSegmentDuration', 0.001),
    minSegmentDuration: parseOptionalNumber(query, 'minSegmentDuration', 0.001),
    maxSegmentDuration: parseOptionalNumber(query, 'maxSegmentDuration', 0.001),
    initialSegmentMultiplier: parseOptionalNumber(query, 'initialSegmentMultiplier', 0.001),
    optimizeForLowLatency: parseOptionalBoolean(query, 'optimizeForLowLatency'),
    bufferSize: parseOptionalNumber(query, 'bufferSize', 1),
    baseChunkDuration: parseOptionalNumber(query, 'baseChunkDuration', 0.001)
  };
}

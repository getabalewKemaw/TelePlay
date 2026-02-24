import type { ChunkingConfig, ChunkingOptions } from '../../types/chunking/ChunkingTypes.js';
import { chunkingValidationError } from '../../errors/chunking/ChunkingErrors.js';
import path from 'path';

const DEFAULT_CHUNK_DURATION = 120;

export const buildConfig = (
  filePath: string,
  totalDuration: number,
  options?: ChunkingOptions
): ChunkingConfig => {
  return {
    chunkDuration: options?.chunkDuration ?? DEFAULT_CHUNK_DURATION,
    totalDuration,
    generateFiles: options?.generateFiles ?? false,
    outputDirectory: options?.outputDirectory,
    baseFilename: options?.baseFilename ?? path.basename(filePath, path.extname(filePath))
  };
};

export const validateConfig = (config: ChunkingConfig): void => {
  if (config.chunkDuration <= 0) {
    throw chunkingValidationError(
      `Chunk duration must be greater than 0, got ${config.chunkDuration}`,
      'chunkDuration'
    );
  }

  if (config.totalDuration <= 0) {
    throw chunkingValidationError(
      `Total duration must be greater than 0, got ${config.totalDuration}`,
      'totalDuration'
    );
  }

  if (config.generateFiles) {
    if (!config.outputDirectory) {
      throw chunkingValidationError(
        'Output directory is required when generateFiles is true',
        'outputDirectory'
      );
    }
  }
};

export const chunkingConfigService = {
  buildConfig,
  validateConfig
};

export type ChunkingConfigService = typeof chunkingConfigService;

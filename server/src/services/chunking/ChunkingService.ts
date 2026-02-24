import type {
  ChunkingResult,
  ChunkMetadata,
  ChunkingOptions,
  MediaMetadata
} from '../../types/chunking/ChunkingTypes.js';
import { chunkingSeekError, chunkingFileError } from '../../errors/chunking/ChunkingErrors.js';
import { ffprobeMetadataProvider } from './FFprobeMetadataProvider.js';
import { existsSync } from 'fs';
import { chunkingConfigService } from './ChunkingConfigService.js';
import { chunkingCalculator } from './ChunkingCalculator.js';
import { chunkFileService } from './ChunkFileService.js';

const metadataProvider = ffprobeMetadataProvider;

const generateChunks = async (filePath: string, options?: ChunkingOptions): Promise<ChunkingResult> => {
  if (!existsSync(filePath)) {
    throw chunkingFileError(`Media file does not exist: ${filePath}`, filePath);
  }

  const metadata = await metadataProvider.getMetadata(filePath);
  const config = chunkingConfigService.buildConfig(filePath, metadata.duration, options);
  chunkingConfigService.validateConfig(config);
  const chunks = chunkingCalculator.calculateChunks(config);

  if (config.generateFiles && config.outputDirectory) {
    chunkFileService.ensureOutputDirectory(config.outputDirectory);
    await chunkFileService.writeChunkFiles(filePath, chunks);
  }

  return {
    chunks,
    totalChunks: chunks.length,
    totalDuration: config.totalDuration,
    chunkDuration: config.chunkDuration,
    lastChunkDuration: chunks.length > 0 ? chunks[chunks.length - 1]!.duration : 0
  };
};

export const getAllChunks = async (filePath: string, options?: ChunkingOptions): Promise<ChunkMetadata[]> => {
  const result = await generateChunks(filePath, options);
  return result.chunks;
};

export const getMetadata = async (filePath: string): Promise<MediaMetadata> => metadataProvider.getMetadata(filePath);

export const getChunkAtTime = async (
  filePath: string,
  time: number,
  options?: ChunkingOptions
): Promise<ChunkMetadata> => {
  if (!Number.isFinite(time) || time < 0) {
    throw chunkingSeekError(`Invalid seek time: ${time}`, time, filePath);
  }
  const chunks = await getAllChunks(filePath, options);
  if (chunks.length === 0) {
    throw chunkingSeekError('No chunks available for seek operation', time, filePath);
  }

  const chunk = chunks.find((c) => c.startTime <= time && c.endTime > time)
    ?? chunks[chunks.length - 1];
  if (!chunk) {
    throw chunkingSeekError('Seek target chunk not found', time, filePath);
  }
  return chunk;
};

export const chunkingService = {
  getAllChunks,
  getMetadata,
  getChunkAtTime
};

export type ChunkingService = typeof chunkingService;



import type { IChunkingService } from '../../interfaces/chunking/IChunkingService.js';
import type { IMediaMetadataProvider } from '../../interfaces/chunking/IMediaMetadataProvider.js';
import type {
  ChunkingResult,
  ChunkMetadata,
  ChunkingOptions,
  ChunkingConfig,
  MediaMetadata
} from '../../types/chunking/ChunkingTypes.js';
import { createChunkingValidationError, createChunkingSeekError, createChunkingFileError } from '../../errors/chunking/ChunkingErrors.js';
import type { IFfmpegService } from '../../interfaces/ffmpeg/IFfmpegService.js';
import { createFFprobeMetadataProvider } from './implementations/FFprobeMetadataProvider.js';
import { createFFmpegService } from '../ffmpeg/FFmpegService.js';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';
const DEFAULT_CHUNK_DURATION = 120;
export const createChunkingService = (
  metadataProvider: IMediaMetadataProvider = createFFprobeMetadataProvider(),
  ffmpegService: IFfmpegService = createFFmpegService(),
  defaultChunkDuration: number = DEFAULT_CHUNK_DURATION
): IChunkingService => {
  const buildConfig = (filePath: string, totalDuration: number, options?: ChunkingOptions): ChunkingConfig => {
    return {
      chunkDuration: options?.chunkDuration ?? defaultChunkDuration,
      totalDuration,
      generateFiles: options?.generateFiles ?? false,
      outputDirectory: options?.outputDirectory,
      baseFilename: options?.baseFilename ?? path.basename(filePath, path.extname(filePath))
    };
  };

  const ensureOutputDirectory = (outputDirectory: string): void => {
    if (!existsSync(outputDirectory)) {
      mkdirSync(outputDirectory, { recursive: true });
    }
  };

  const writeChunkFiles = async (filePath: string, chunks: ChunkMetadata[]): Promise<void> => {
    for (const chunk of chunks) {
      if (!chunk.filePath) continue;
      await ffmpegService.decode({
        input: { path: filePath },
        output: { path: chunk.filePath },
        startTime: chunk.startTime,
        duration: chunk.duration
      });
    }
  };

  const generateChunks = async (filePath: string, options?: ChunkingOptions): Promise<ChunkingResult> => {
    if (!existsSync(filePath)) {
      throw createChunkingFileError(`Media file does not exist: ${filePath}`, filePath);
    }

    const metadata = await metadataProvider.getMetadata(filePath);
    const config = buildConfig(filePath, metadata.duration, options);
    validateConfig(config);
    const chunks = calculateChunks(config);

    if (config.generateFiles && config.outputDirectory) {
      ensureOutputDirectory(config.outputDirectory);
      await writeChunkFiles(filePath, chunks);
    }

    return {
      chunks,
      totalChunks: chunks.length,
      totalDuration: config.totalDuration,
      chunkDuration: config.chunkDuration,
      lastChunkDuration: chunks.length > 0 ? chunks[chunks.length - 1]!.duration : 0
    };
  };
  const getAllChunks = async (filePath: string, options?: ChunkingOptions): Promise<ChunkMetadata[]> => {
    const result = await generateChunks(filePath, options);
    return result.chunks;
  };

  const getMetadata = async (filePath: string): Promise<MediaMetadata> => metadataProvider.getMetadata(filePath);

  const getChunkAtTime = async (
    filePath: string,
    time: number,
    options?: ChunkingOptions
  ): Promise<ChunkMetadata> => {
    if (!Number.isFinite(time) || time < 0) {
      throw createChunkingSeekError(`Invalid seek time: ${time}`, time, filePath);
    }
    const chunks = await getAllChunks(filePath, options);
    if (chunks.length === 0) {
      throw createChunkingSeekError('No chunks available for seek operation', time, filePath);
    }

    const chunk = chunks.find((c) => c.startTime <= time && c.endTime > time)
      ?? chunks[chunks.length - 1];
    if (!chunk) {
      throw createChunkingSeekError('Seek target chunk not found', time, filePath);
    }
    return chunk;
  };

  const calculateChunks = (config: ChunkingConfig): ChunkMetadata[] => {
    const chunks: ChunkMetadata[] = [];
    const totalDuration = config.totalDuration;
    const chunkDuration = config.chunkDuration;

    // Calculate number of chunks
    const numChunks = Math.ceil(totalDuration / chunkDuration);

    for (let i = 0; i < numChunks; i++) {
      const startTime = i * chunkDuration;
      const endTime = Math.min(startTime + chunkDuration, totalDuration);
      const duration = endTime - startTime;

      const chunk: ChunkMetadata = {
        index: i,
        startTime,
        endTime,
        duration
      };

      if (config.generateFiles && config.outputDirectory) {
        const extension = path.extname(config.baseFilename || 'chunk');
        const baseName = path.basename(config.baseFilename || 'chunk', extension);
        chunk.filePath = path.join(
          config.outputDirectory,
          `${baseName}_chunk_${i.toString().padStart(4, '0')}${extension}`
        );
      }
      chunks.push(chunk);
    }
    return chunks;
  };

  const validateConfig = (config: ChunkingConfig): void => {
    if (config.chunkDuration <= 0) {
      throw createChunkingValidationError(
        `Chunk duration must be greater than 0, got ${config.chunkDuration}`,
        'chunkDuration'
      );
    }

    if (config.totalDuration <= 0) {
      throw createChunkingValidationError(
        `Total duration must be greater than 0, got ${config.totalDuration}`,
        'totalDuration'
      );
    }

    if (config.generateFiles) {
      if (!config.outputDirectory) {
        throw createChunkingValidationError(
          'Output directory is required when generateFiles is true',
          'outputDirectory'
        );
      }

    }
  };

  return {
    getAllChunks,
    getMetadata,
    getChunkAtTime
  };
};

export type ChunkingService = ReturnType<typeof createChunkingService>;

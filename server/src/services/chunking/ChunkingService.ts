
/**
 * Chunking Service - Time-Based Media Control
 * Splits media files into time-based chunks for fast-forward, rewind, and streaming
 */

import type { IChunkingService } from '../../interfaces/ffmpeg/IChunkingService.js';
import type { IMediaMetadataProvider } from '../../interfaces/chunking/IMediaMetadataProvider.js';
import type {
  ChunkingResult,
  ChunkMetadata,
  SeekParams,
  SeekResult,
  ChunkingOptions,
  ChunkingConfig
} from '../../types/chunking/ChunkingTypes.js';
import { ChunkingValidationError, ChunkingSeekError, ChunkingFileError } from '../../errors/chunking/ChunkingErrors.js';
import { FFprobeMetadataProvider } from './implementations/FFprobeMetadataProvider.js';
import { existsSync } from 'fs';
import path from 'path';

/**
 * Default chunk duration in seconds (2 minutes)
 */
const DEFAULT_CHUNK_DURATION = 120;
export class ChunkingService implements IChunkingService {
  private readonly metadataProvider: IMediaMetadataProvider;
  private readonly defaultChunkDuration: number;

  constructor(
    metadataProvider?: IMediaMetadataProvider,
    defaultChunkDuration: number = DEFAULT_CHUNK_DURATION
  ) {
    this.metadataProvider = metadataProvider ?? new FFprobeMetadataProvider();
    this.defaultChunkDuration = defaultChunkDuration;
  }
  async generateChunks(filePath: string, options?: ChunkingOptions): Promise<ChunkingResult> {
    if (!existsSync(filePath)) {
      throw new ChunkingFileError(`Media file does not exist: ${filePath}`, filePath);
    }

    // Get media metadata
    const metadata = await this.metadataProvider.getMetadata(filePath);

    // Build chunking config
    const config: ChunkingConfig = {
      chunkDuration: options?.chunkDuration ?? this.defaultChunkDuration,
      totalDuration: metadata.duration,
      generateFiles: options?.generateFiles ?? false,
      outputDirectory: options?.outputDirectory,
      baseFilename: options?.baseFilename ?? path.basename(filePath, path.extname(filePath))
    };

    // Validate config
    this.validateConfig(config);

    // Generate chunks
    const chunks = this.calculateChunks(config);

    return {
      chunks,
      totalChunks: chunks.length,
      totalDuration: config.totalDuration,
      chunkDuration: config.chunkDuration,
      lastChunkDuration: chunks.length > 0 ? chunks[chunks.length - 1]!.duration : 0
    };
  }

  /**
   * Get chunk metadata for a specific chunk index
   */
  async getChunk(filePath: string, chunkIndex: number, options?: ChunkingOptions): Promise<ChunkMetadata> {
    const result = await this.generateChunks(filePath, options);

    if (chunkIndex < 0 || chunkIndex >= result.chunks.length) {
      throw new ChunkingValidationError(
        `Chunk index ${chunkIndex} is out of range. Valid range: 0-${result.chunks.length - 1}`,
        'chunkIndex'
      );
    }

    const chunk = result.chunks[chunkIndex] ?? null;
    if (chunk === null) {
      throw new ChunkingValidationError(
        `Chunk at index ${chunkIndex} is null or undefined`,
        'chunkIndex'
      );
    }
    return chunk;
  }
  async getAllChunks(filePath: string, options?: ChunkingOptions): Promise<ChunkMetadata[]> {
    const result = await this.generateChunks(filePath, options);
    return result.chunks;
  }

  async seek(filePath: string, params: SeekParams, options?: ChunkingOptions): Promise<SeekResult> {
    const result = await this.generateChunks(filePath, options);

    // Validate time
    if (params.time < 0 || params.time > result.totalDuration) {
      throw new ChunkingSeekError(
        `Seek time ${params.time}s is out of range. Valid range: 0-${result.totalDuration}s`,
        params.time
      );
    }

    // Find the chunk containing this time
    const chunk = this.findChunkAtTime(result.chunks, params.time, params.exact ?? false);
    if (!chunk) {
      throw new ChunkingSeekError(
        `Could not find chunk for time ${params.time}s`,
        params.time
      );
    }
    const offsetInChunk = params.time - chunk.startTime;
    const exact = params.time >= chunk.startTime && params.time < chunk.endTime;

    return {
      chunk,
      offsetInChunk,
      exact
    };
  }

  /**
   * Get chunk that contains a specific time
   */
  async getChunkAtTime(filePath: string, time: number, options?: ChunkingOptions): Promise<ChunkMetadata> {
    const result = await this.seek(filePath, { time, exact: false }, options);
    return result.chunk;
  }

  /**
   * Get chunks for a time range
   */
  async getChunksInRange(
    filePath: string,
    startTime: number,
    endTime: number,
    options?: ChunkingOptions
  ): Promise<ChunkMetadata[]> {
    const result = await this.generateChunks(filePath, options);

    // Validate range
    if (startTime < 0 || endTime > result.totalDuration || startTime >= endTime) {
      throw new ChunkingValidationError(
        `Invalid time range: ${startTime}s - ${endTime}s`,
        'timeRange'
      );
    }

    // Find chunks that overlap with the range
    return result.chunks.filter(chunk => {
      return (
        (chunk.startTime >= startTime && chunk.startTime < endTime) ||
        (chunk.endTime > startTime && chunk.endTime <= endTime) ||
        (chunk.startTime <= startTime && chunk.endTime >= endTime)
      );
    });
  }

  /**
   * Calculate chunks based on configuration
   * This is the core chunking algorithm
   */
  private calculateChunks(config: ChunkingConfig): ChunkMetadata[] {
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

      // Add file path if generating files
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
  }

  /**
   * Find chunk at a specific time
   */
  private findChunkAtTime(
    chunks: ChunkMetadata[],
    time: number,
    exact: boolean
  ): ChunkMetadata | null {
    // Binary search for efficiency with large chunk counts
    let left = 0;
    let right = chunks.length - 1;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const chunk = chunks[mid];
      if (chunk && time >= chunk.startTime && time < chunk.endTime) {
        return chunk;
      }
      if (chunk && time < chunk.startTime) {
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    }

    // If exact match required, return null
    if (exact) {
      return null;
    }

    // Otherwise, return nearest chunk or null
    if (left > 0 && left <= chunks.length) {
      return typeof chunks[left - 1] !== 'undefined' ? chunks[left - 1]! : null;
    }
    if (right >= 0 && right < chunks.length) {
      return typeof chunks[right] !== 'undefined' ? chunks[right]! : null;
    }

    return typeof chunks[0] !== 'undefined' ? chunks[0]! : null;
  }

  /**
   * Validate chunking configuration
   */
  private validateConfig(config: ChunkingConfig): void {
    if (config.chunkDuration <= 0) {
      throw new ChunkingValidationError(
        `Chunk duration must be greater than 0, got ${config.chunkDuration}`,
        'chunkDuration'
      );
    }

    if (config.totalDuration <= 0) {
      throw new ChunkingValidationError(
        `Total duration must be greater than 0, got ${config.totalDuration}`,
        'totalDuration'
      );
    }

    if (config.generateFiles) {
      if (!config.outputDirectory) {
        throw new ChunkingValidationError(
          'Output directory is required when generateFiles is true',
          'outputDirectory'
        );
      }

      if (!existsSync(config.outputDirectory)) {
        throw new ChunkingFileError(
          `Output directory does not exist: ${config.outputDirectory}`,
          config.outputDirectory
        );
      }
    }
  }
}

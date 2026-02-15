
import type { IChunkingService } from '../../interfaces/chunking/IChunkingService.js';
import type { IMediaMetadataProvider } from '../../interfaces/chunking/IMediaMetadataProvider.js';
import type {
  ChunkingResult,
  ChunkMetadata,
  ChunkingOptions,
  ChunkingConfig,
  MediaMetadata
} from '../../types/chunking/ChunkingTypes.js';
import { ChunkingValidationError, ChunkingSeekError, ChunkingFileError } from '../../errors/chunking/ChunkingErrors.js';
import type { IFfmpegService } from '../../interfaces/ffmpeg/IFfmpegService.js';
import { FFprobeMetadataProvider } from './implementations/FFprobeMetadataProvider.js';
import { FFmpegService } from '../ffmpeg/FFmpegService.js';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';
const DEFAULT_CHUNK_DURATION = 120;
export class ChunkingService implements IChunkingService {
  private readonly metadataProvider: IMediaMetadataProvider;
  private readonly ffmpegService: IFfmpegService;
  private readonly defaultChunkDuration: number;
  constructor(
    metadataProvider?: IMediaMetadataProvider,
    ffmpegService?: IFfmpegService,
    defaultChunkDuration: number = DEFAULT_CHUNK_DURATION
  ) {
    this.metadataProvider = metadataProvider ?? new FFprobeMetadataProvider();
    this.ffmpegService = ffmpegService ?? new FFmpegService();
    this.defaultChunkDuration = defaultChunkDuration;
  }

  private buildConfig(filePath: string, totalDuration: number, options?: ChunkingOptions): ChunkingConfig {
    return {
      chunkDuration: options?.chunkDuration ?? this.defaultChunkDuration,
      totalDuration,
      generateFiles: options?.generateFiles ?? false,
      outputDirectory: options?.outputDirectory,
      baseFilename: options?.baseFilename ?? path.basename(filePath, path.extname(filePath))
    };
  }

  private ensureOutputDirectory(outputDirectory: string): void {
    if (!existsSync(outputDirectory)) {
      mkdirSync(outputDirectory, { recursive: true });
    }
  }

  private async writeChunkFiles(filePath: string, chunks: ChunkMetadata[]): Promise<void> {
    for (const chunk of chunks) {
      if (!chunk.filePath) continue;
      await this.ffmpegService.decode({
        input: { path: filePath },
        output: { path: chunk.filePath },
        startTime: chunk.startTime,
        duration: chunk.duration
      });
    }
  }

  private async generateChunks(filePath: string, options?: ChunkingOptions): Promise<ChunkingResult> {
    if (!existsSync(filePath)) {
      throw new ChunkingFileError(`Media file does not exist: ${filePath}`, filePath);
    }

    const metadata = await this.metadataProvider.getMetadata(filePath);
    const config = this.buildConfig(filePath, metadata.duration, options);
    this.validateConfig(config);
    const chunks = this.calculateChunks(config);

    if (config.generateFiles && config.outputDirectory) {
      this.ensureOutputDirectory(config.outputDirectory);
      await this.writeChunkFiles(filePath, chunks);
    }

    return {
      chunks,
      totalChunks: chunks.length,
      totalDuration: config.totalDuration,
      chunkDuration: config.chunkDuration,
      lastChunkDuration: chunks.length > 0 ? chunks[chunks.length - 1]!.duration : 0
    };
  }
  async getAllChunks(filePath: string, options?: ChunkingOptions): Promise<ChunkMetadata[]> {
    const result = await this.generateChunks(filePath, options);
    return result.chunks;
  }

  async getMetadata(filePath: string): Promise<MediaMetadata> {
    return this.metadataProvider.getMetadata(filePath);
  }

  async getChunkAtTime(filePath: string, time: number, options?: ChunkingOptions): Promise<ChunkMetadata> {
    if (!Number.isFinite(time) || time < 0) {
      throw new ChunkingSeekError(`Invalid seek time: ${time}`, time, filePath);
    }
    const chunks = await this.getAllChunks(filePath, options);
    if (chunks.length === 0) {
      throw new ChunkingSeekError('No chunks available for seek operation', time, filePath);
    }

    const chunk = chunks.find((c) => c.startTime <= time && c.endTime > time)
      ?? chunks[chunks.length - 1];
    if (!chunk) {
      throw new ChunkingSeekError('Seek target chunk not found', time, filePath);
    }
    return chunk;
  }

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

    }
  }
}


import type { IChunkingService } from '../../interfaces/chunking/IChunkingService.js';
import type { IMediaMetadataProvider } from '../../interfaces/chunking/IMediaMetadataProvider.js';
import type {
  ChunkingResult,
  ChunkMetadata,
  ChunkingOptions,
  ChunkingConfig
} from '../../types/chunking/ChunkingTypes.js';
import { ChunkingValidationError, ChunkingSeekError, ChunkingFileError } from '../../errors/chunking/ChunkingErrors.js';
import type { IFfmpegService } from '../../interfaces/ffmpeg/IFfmpegService.js';
import { FFprobeMetadataProvider } from './implementations/FFprobeMetadataProvider.js';
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
    this.ffmpegService = ffmpegService as any; // This will be injected via DI or passed in
    this.defaultChunkDuration = defaultChunkDuration;
  }
  private async generateChunks(filePath: string, options?: ChunkingOptions): Promise<ChunkingResult> {
    if (!existsSync(filePath)) {
      throw new ChunkingFileError(`Media file does not exist: ${filePath}`, filePath);
    }

    
    const metadata = await this.metadataProvider.getMetadata(filePath);
    const config: ChunkingConfig = {
      chunkDuration: options?.chunkDuration ?? this.defaultChunkDuration,
      totalDuration: metadata.duration,
      generateFiles: options?.generateFiles ?? false,
      outputDirectory: options?.outputDirectory,
      baseFilename: options?.baseFilename ?? path.basename(filePath, path.extname(filePath))
    };
    this.validateConfig(config);
    const chunks = this.calculateChunks(config);

    // Physically split data 
    if (config.generateFiles && config.outputDirectory) {
      if (!existsSync(config.outputDirectory)) {
        mkdirSync(config.outputDirectory, { recursive: true });
      }

      for (const chunk of chunks) {
        if (chunk.filePath) {
          await this.ffmpegService.decode({
            input: { path: filePath },
            output: { path: chunk.filePath },
            startTime: chunk.startTime,
            duration: chunk.duration
          });
        }
      }
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
      //add file paths 
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

      if (!existsSync(config.outputDirectory)) {
        throw new ChunkingFileError(
          `Output directory does not exist: ${config.outputDirectory}`,
          config.outputDirectory
        );
      }
    }
  }
}

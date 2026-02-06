/**
 * Compression Service – Network Efficiency Layer
 * Reduces media size before network transmission or storage
 */

import type { ICompressionService } from '../../interfaces/compression/ICompressionService.js';

import type { IFfmpegService } from '../../interfaces/compression/IFfmpegService.js';
import type {
  CompressionResult,
  CompressionOptions,
  CompressionConfig,
} from '../../types/compression/CompressionTypes.js';
import { CompressionValidator } from '../../validator/compression/CompressionValidator.js';
import { CompressionValidationError, CompressionFileError } from '../../errors/compression/CompressionErrors.js';
import { promises as fs } from 'fs';

import path from 'path';
import type { AudioCodec, SampleRate, ChannelConfig } from '../../types/ffmpeg/FFmpegTypes.js';

/**
 * Default compression configuration
 */
const DEFAULT_CONFIG: CompressionConfig = {
  level: 'medium',
  strategy: 'balanced',
  mode: 'transcode',
  codec: 'aac',
  preserveOriginal: true
};

/**
 * Compression Service Implementation
 * 
 * Responsibilities:
 * - Compress media files using FFmpeg
 * - Support multiple compression levels and strategies
 * - Track compression metrics
 * - Provide compression recommendations
 * - Balance compression ratio vs decoding latency
 */
export class CompressionService implements ICompressionService {
  private readonly ffmpegService: IFfmpegService;
  private readonly defaultConfig: CompressionConfig;





  /**
   * Perform actual compression using FFmpeg
   */
  private async performCompression(
    inputPath: string,
    outputPath: string,
    config: CompressionConfig
  ): Promise<void> {
    // Map compression level to bitrate if not specified
    const bitrate = config.targetBitrate || this.getBitrateForLevel(config.level, config.strategy);

    // Determine codec
    const codec = (config.codec || 'aac') as AudioCodec;

    // Use default sample rate and channels (can be enhanced to detect from file)
    const sampleRate = 44100 as SampleRate;
    const channels = 2 as ChannelConfig;

    // Compress using FFmpeg encode
    await this.ffmpegService.encode({
      input: { path: inputPath },
      output: { path: outputPath },
      encoding: {
        codec,
        sampleRate,
        channels,
        bitrate
      }
    });
  }

  /**
   * Get bitrate for compression level and strategy
   */
  private getBitrateForLevel(level: CompressionLevel, strategy: CompressionStrategy): number {
    const bitrateMap: Record<string, Record<string, number>> = {
      low: { fast: 160, quality: 192, balanced: 128, size: 112 },
      medium: { fast: 112, quality: 128, balanced: 96, size: 80 },
      high: { fast: 80, quality: 96, balanced: 64, size: 56 },
      maximum: { fast: 56, quality: 64, balanced: 48, size: 40 }
    };

    return bitrateMap[level]?.[strategy] ?? 96;
  }

  /**
   * Generate output path for compressed file
   */
  private generateOutputPath(inputPath: string, config: CompressionConfig): string {
    const dir = path.dirname(inputPath);
    const ext = path.extname(inputPath);
    const baseName = path.basename(inputPath, ext);
    const codec = config.codec || 'aac';
    
    return path.join(dir, `${baseName}_compressed_${config.level}_${codec}${ext}`);
  }

  /**
   * Build configuration from options
   */
  private buildConfig(options?: CompressionOptions): CompressionConfig {
    return {
      level: options?.level ?? this.defaultConfig.level,
      strategy: options?.strategy ?? this.defaultConfig.strategy,
      targetBitrate: options?.targetBitrate,
      targetSize: options?.targetSize,
      mode: options?.mode ?? this.defaultConfig.mode,
      codec: (options?.codec ?? this.defaultConfig.codec ?? 'aac') as string,
      preserveOriginal: options?.preserveOriginal ?? this.defaultConfig.preserveOriginal
    };
  }
}

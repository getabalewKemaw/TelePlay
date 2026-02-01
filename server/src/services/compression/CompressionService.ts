/**
 * Compression Service – Network Efficiency Layer
 * Reduces media size before network transmission or storage
 */

import type { ICompressionService } from './interfaces/ICompressionService.js';
import type { IFfmpegService } from './interfaces/IFfmpegService.js';
import type {
  CompressionResult,
  CompressionOptions,
  CompressionConfig,
  CompressionPreset,
  CompressionMetrics,
  CompressionRecommendation,
  CompressionLevel,
  CompressionStrategy
} from './types/CompressionTypes.js';
import { CompressionValidator } from './validators/CompressionValidator.js';
import { CompressionValidationError, CompressionFileError, CompressionPresetError } from './errors/CompressionErrors.js';
import { COMPRESSION_PRESETS, getPreset, getDefaultPreset } from './presets/CompressionPresets.js';
import { promises as fs } from 'fs';
import { existsSync } from 'fs';
import path from 'path';
import type { AudioCodec, SampleRate, ChannelConfig } from '../../ffmpeg/types/FFmpegTypes.js';

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
   * Constructor with dependency injection
   * @param ffmpegService - FFmpeg service instance
   * @param defaultConfig - Default compression configuration
   */
  constructor(
    ffmpegService: IFfmpegService,
    defaultConfig?: Partial<CompressionConfig>
  ) {
    this.ffmpegService = ffmpegService;
    this.defaultConfig = { ...DEFAULT_CONFIG, ...defaultConfig };
  }

  /**
   * Compress a media file
   */
  async compress(inputPath: string, options?: CompressionOptions): Promise<CompressionResult> {
    // Validate input
    await CompressionValidator.validateInputFile(inputPath);

    // Validate options
    if (options) {
      CompressionValidator.validateOptions(options);
    }

    // Build configuration
    const config = this.buildConfig(options);

    // Get original file size
    const originalStats = await fs.stat(inputPath);
    const originalSize = originalStats.size;

    // Generate output path
    const outputPath = options?.outputPath || this.generateOutputPath(inputPath, config);

    // Validate output path
    await CompressionValidator.validateOutputPath(outputPath);

    // Perform compression
    const startTime = Date.now();
    
    try {
      await this.performCompression(inputPath, outputPath, config);
    } catch (error) {
      throw new CompressionFileError(
        `Compression failed: ${error instanceof Error ? error.message : String(error)}`,
        inputPath
      );
    }

    const executionTime = Date.now() - startTime;

    // Get compressed file size
    const compressedStats = await fs.stat(outputPath);
    const compressedSize = compressedStats.size;

    // Calculate metrics
    const compressionRatio = compressedSize / originalSize;
    const compressionPercentage = (1 - compressionRatio) * 100;
    const bandwidthSavings = originalSize - compressedSize;

    return {
      outputPath,
      originalSize,
      compressedSize,
      compressionRatio,
      compressionPercentage,
      executionTime,
      bandwidthSavings,
      config
    };
  }

  /**
   * Get compression recommendation for a file
   */
  async getRecommendation(
    inputPath: string,
    targetSize?: number
  ): Promise<CompressionRecommendation> {
    await CompressionValidator.validateInputFile(inputPath);

    const stats = await fs.stat(inputPath);
    const fileSize = stats.size;

    // Analyze file characteristics
    const extension = path.extname(inputPath).toLowerCase();
    const isAlreadyCompressed = ['.mp3', '.aac', '.opus', '.ogg'].includes(extension);

    // Determine recommendation based on file size and characteristics
    let recommendedLevel: CompressionLevel;
    let recommendedStrategy: CompressionStrategy;
    let recommendedBitrate: number | undefined;
    let expectedRatio: number;
    let reasoning: string;

    if (targetSize && fileSize > targetSize) {
      // Target size specified
      const requiredRatio = targetSize / fileSize;
      
      if (requiredRatio < 0.3) {
        recommendedLevel = 'maximum';
        recommendedStrategy = 'size';
        recommendedBitrate = 48;
        expectedRatio = 0.25;
        reasoning = 'Extreme compression required to meet target size';
      } else if (requiredRatio < 0.5) {
        recommendedLevel = 'high';
        recommendedStrategy = 'size';
        recommendedBitrate = 64;
        expectedRatio = 0.45;
        reasoning = 'High compression needed to meet target size';
      } else {
        recommendedLevel = 'medium';
        recommendedStrategy = 'balanced';
        recommendedBitrate = 96;
        expectedRatio = 0.6;
        reasoning = 'Moderate compression sufficient for target size';
      }
    } else if (isAlreadyCompressed) {
      // Already compressed format
      recommendedLevel = 'low';
      recommendedStrategy = 'quality';
      recommendedBitrate = 128;
      expectedRatio = 0.9;
      reasoning = 'File is already compressed, minimal additional compression recommended';
    } else if (fileSize > 100 * 1024 * 1024) {
      // Large file (>100MB)
      recommendedLevel = 'high';
      recommendedStrategy = 'size';
      recommendedBitrate = 64;
      expectedRatio = 0.4;
      reasoning = 'Large file benefits from high compression';
    } else if (fileSize > 10 * 1024 * 1024) {
      // Medium file (10-100MB)
      recommendedLevel = 'medium';
      recommendedStrategy = 'balanced';
      recommendedBitrate = 96;
      expectedRatio = 0.55;
      reasoning = 'Medium file, balanced compression recommended';
    } else {
      // Small file (<10MB)
      recommendedLevel = 'low';
      recommendedStrategy = 'quality';
      recommendedBitrate = 128;
      expectedRatio = 0.75;
      reasoning = 'Small file, prioritize quality over size reduction';
    }

    const expectedReduction = (1 - expectedRatio) * 100;

    return {
      recommendedLevel,
      recommendedStrategy,
      recommendedBitrate,
      expectedRatio,
      expectedReduction,
      reasoning
    };
  }

  /**
   * Get available compression presets
   */
  getPresets(): CompressionPreset[] {
    return [...COMPRESSION_PRESETS];
  }

  /**
   * Compress using a preset
   */
  async compressWithPreset(
    inputPath: string,
    presetName: string,
    options?: CompressionOptions
  ): Promise<CompressionResult> {
    const preset = getPreset(presetName);

    if (!preset) {
      throw new CompressionPresetError(
        `Unknown compression preset: ${presetName}`,
        presetName
      );
    }

    // Merge preset with options
    const mergedOptions: CompressionOptions = {
      level: preset.level,
      strategy: preset.strategy,
      targetBitrate: preset.targetBitrate,
      ...options
    };

    return this.compress(inputPath, mergedOptions);
  }

  /**
   * Estimate compression result without actually compressing
   */
  async estimateCompression(
    inputPath: string,
    options?: CompressionOptions
  ): Promise<CompressionMetrics> {
    await CompressionValidator.validateInputFile(inputPath);

    const stats = await fs.stat(inputPath);
    const fileSize = stats.size;

    const config = this.buildConfig(options);

    // Estimate compression ratio based on level and strategy
    const ratioMap: Record<string, Record<string, number>> = {
      low: { fast: 0.8, quality: 0.75, balanced: 0.7, size: 0.65 },
      medium: { fast: 0.65, quality: 0.6, balanced: 0.55, size: 0.5 },
      high: { fast: 0.5, quality: 0.45, balanced: 0.4, size: 0.35 },
      maximum: { fast: 0.4, quality: 0.35, balanced: 0.3, size: 0.25 }
    };

    const estimatedRatio = ratioMap[config.level]?.[config.strategy] ?? 0.6;

    // Estimate compression time (rough: 1MB per second for medium compression)
    const baseSpeed = 1024 * 1024; // 1 MB/s
    const speedMultiplier = {
      low: 2,
      medium: 1,
      high: 0.5,
      maximum: 0.25
    }[config.level] ?? 1;

    const estimatedSpeed = baseSpeed * speedMultiplier;
    const estimatedTime = (fileSize / estimatedSpeed) * 1000; // milliseconds

    return {
      compressionRatio: estimatedRatio,
      compressionSpeed: estimatedSpeed,
      compressionTime: estimatedTime
    };
  }

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
      codec: options?.codec ?? this.defaultConfig.codec,
      preserveOriginal: options?.preserveOriginal ?? this.defaultConfig.preserveOriginal
    };
  }
}

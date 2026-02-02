/**
 * Transcoding Service – Codec Interoperability Layer
 * Converts PCM and telecom codecs into browser-playable formats
 */

import type { ITranscodingService } from '../../interfaces/transcoding/ITranscodingService.js';
import type { IFfmpegService } from '../../interfaces/transcoding/IFfmpegService.js';
import type {
  TranscodingResult,
  TranscodingOptions,
  ChunkTranscodingParams,
  TranscodingConfig,
  SourceCodec,
  TargetCodec
} from '../../types/transcoding/TranscodingTypes.js';
import { TranscodingValidationError, TranscodingCodecError, TranscodingFileError } from '../../errors/transcoding/TranscodingErrors.js';
import { promises as fs } from 'fs';
import { existsSync } from 'fs';
import path from 'path';
import type { AudioCodec, SampleRate, ChannelConfig } from '../../types/ffmpeg/FFmpegTypes.js';

/**
 * Default target codec (browser-playable)
 */
const DEFAULT_TARGET_CODEC: TargetCodec = 'aac';

/**
 * Default target sample rate
 */
const DEFAULT_TARGET_SAMPLE_RATE: SampleRate = 44100;

/**
 * Default target channels
 */
const DEFAULT_TARGET_CHANNELS: ChannelConfig = 2;

/**
 * Codec compatibility matrix
 */
const CODEC_COMPATIBILITY: Record<SourceCodec, { recommended: TargetCodec; compatible: TargetCodec[] }> = {
  g711: {
    recommended: 'aac',
    compatible: ['aac', 'mp3', 'opus']
  },
  g726: {
    recommended: 'aac',
    compatible: ['aac', 'mp3', 'opus']
  },
  g728: {
    recommended: 'aac',
    compatible: ['aac', 'mp3', 'opus']
  },
  pcm_s16le: {
    recommended: 'aac',
    compatible: ['aac', 'mp3', 'opus', 'pcm_s16le']
  },
  pcm_s24le: {
    recommended: 'aac',
    compatible: ['aac', 'mp3', 'opus', 'pcm_s16le']
  }
};

/**
 * Transcoding Service Implementation
 * 
 * Responsibilities:
 * - Convert telecom codecs to browser-playable formats
 * - Support chunk-based transcoding
 * - Integrate with FFmpeg service
 * - Handle codec compatibility
 */
export class TranscodingService implements ITranscodingService {
  private readonly ffmpegService: IFfmpegService;

  /**
   * Constructor with dependency injection
   * @param ffmpegService - FFmpeg service instance
   */
  constructor(ffmpegService: IFfmpegService) {
    this.ffmpegService = ffmpegService;
  }

  /**
   * Transcode a media file from source to target codec
   */
  async transcode(inputPath: string, options?: TranscodingOptions): Promise<TranscodingResult> {
    // Validate input file
    if (!existsSync(inputPath)) {
      throw new TranscodingFileError(`Input file does not exist: ${inputPath}`, inputPath);
    }

    // Build configuration
    const config = this.buildConfig(options);

    // Validate configuration
    this.validateConfig(config);

    // Generate output path
    const outputPath = options?.outputPath || this.generateOutputPath(inputPath, config.target.codec);

    // Get original file size
    const originalStats = await fs.stat(inputPath);
    const originalSize = originalStats.size;

    // Perform transcoding
    const startTime = Date.now();

    try {
      await this.performTranscoding(inputPath, outputPath, config);
    } catch (error) {
      throw new TranscodingCodecError(
        `Transcoding failed: ${error instanceof Error ? error.message : String(error)}`,
        config.source.codec,
        config.target.codec
      );
    }

    const executionTime = Date.now() - startTime;

    // Get transcoded file size
    const transcodedStats = await fs.stat(outputPath);
    const transcodedSize = transcodedStats.size;

    return {
      outputPath,
      originalSize,
      transcodedSize,
      executionTime,
      sourceCodec: config.source.codec,
      targetCodec: config.target.codec,
      config
    };
  }

  /**
   * Transcode a chunk (partial file)
   */
  async transcodeChunk(params: ChunkTranscodingParams): Promise<TranscodingResult> {
    // Validate input
    if (!existsSync(params.inputPath)) {
      throw new TranscodingFileError(`Chunk file does not exist: ${params.inputPath}`, params.inputPath);
    }

    // Validate source encoding
    this.validateSourceEncoding(params.sourceEncoding);

    // Validate target encoding
    this.validateTargetEncoding(params.targetEncoding);

    // Get original size
    const originalStats = await fs.stat(params.inputPath);
    const originalSize = originalStats.size;

    // Perform chunk transcoding
    const startTime = Date.now();

    const config: TranscodingConfig = {
      source: params.sourceEncoding,
      target: params.targetEncoding,
      mode: 'chunk'
    };

    try {
      await this.performTranscoding(params.inputPath, params.outputPath, config);
    } catch (error) {
      throw new TranscodingCodecError(
        `Chunk transcoding failed: ${error instanceof Error ? error.message : String(error)}`,
        params.sourceEncoding.codec,
        params.targetEncoding.codec
      );
    }

    const executionTime = Date.now() - startTime;

    // Get transcoded size
    const transcodedStats = await fs.stat(params.outputPath);
    const transcodedSize = transcodedStats.size;

    return {
      outputPath: params.outputPath,
      originalSize,
      transcodedSize,
      executionTime,
      sourceCodec: params.sourceEncoding.codec,
      targetCodec: params.targetEncoding.codec,
      config
    };
  }

  /**
   * Transcode for streaming (time range)
   */
  async transcodeForStreaming(
    inputPath: string,
    startTime: number,
    duration: number,
    options?: TranscodingOptions
  ): Promise<TranscodingResult> {
    if (startTime < 0) {
      throw new TranscodingValidationError('Start time must be non-negative', 'startTime');
    }

    if (duration <= 0) {
      throw new TranscodingValidationError('Duration must be greater than 0', 'duration');
    }

    // Build configuration with streaming mode
    const config = this.buildConfig({
      ...options,
      mode: 'stream',
      startTime,
      duration
    });

    // For streaming, we'll transcode the full file but mark it as streaming mode
    // In a full implementation, this would use FFmpeg's -ss and -t options
    return this.transcode(inputPath, {
      ...options,
      mode: 'stream',
      startTime,
      duration
    });
  }

  /**
   * Get recommended target codec for source codec
   */
  getRecommendedTargetCodec(sourceCodec: string): string {
    const compatibility = CODEC_COMPATIBILITY[sourceCodec as SourceCodec];
    if (!compatibility) {
      return DEFAULT_TARGET_CODEC;
    }
    return compatibility.recommended;
  }

  /**
   * Check if transcoding is needed
   */
  async isTranscodingNeeded(inputPath: string, targetCodec: string): Promise<boolean> {
    // Simple check: if file extension matches target codec, might not need transcoding
    const ext = path.extname(inputPath).toLowerCase();
    const codecExtensions: Record<string, string[]> = {
      aac: ['.aac', '.m4a'],
      mp3: ['.mp3'],
      opus: ['.opus', '.ogg'],
      pcm_s16le: ['.wav', '.pcm']
    };

    const targetExtensions = codecExtensions[targetCodec] || [];
    if (targetExtensions.includes(ext)) {
      // File extension matches, but we'd need to check actual codec
      // For now, assume transcoding might be needed
      return true;
    }

    // Different extension, likely needs transcoding
    return true;
  }

  /**
   * Perform actual transcoding using FFmpeg
   */
  private async performTranscoding(
    inputPath: string,
    outputPath: string,
    config: TranscodingConfig
  ): Promise<void> {
    // Map codecs to FFmpeg codec names
    const sourceCodec = this.mapCodecToFFmpeg(config.source.codec);
    const targetCodec = this.mapCodecToFFmpeg(config.target.codec);

    // Build transcode parameters for FFmpeg service
    // Note: FFmpeg service transcode expects TranscodeParams format
    const transcodeParams: any = {
      input: { path: inputPath },
      output: { path: outputPath },
      sourceEncoding: {
        codec: config.source.codec as AudioCodec,
        sampleRate: config.source.sampleRate,
        channels: config.source.channels,
        bitrate: config.source.bitrate
      },
      targetEncoding: {
        codec: config.target.codec as AudioCodec,
        sampleRate: config.target.sampleRate,
        channels: config.target.channels,
        bitrate: config.target.bitrate
      }
    };

    await this.ffmpegService.transcode(transcodeParams);
  }

  /**
   * Map internal codec names to FFmpeg codec names
   */
  private mapCodecToFFmpeg(codec: string): string {
    const codecMap: Record<string, string> = {
      g711: 'pcm_mulaw',
      g726: 'g726',
      g728: 'g728',
      pcm_s16le: 'pcm_s16le',
      pcm_s24le: 'pcm_s24le',
      aac: 'aac',
      mp3: 'libmp3lame',
      opus: 'libopus'
    };

    return codecMap[codec] || codec;
  }

  /**
   * Build configuration from options
   */
  private buildConfig(options?: TranscodingOptions): TranscodingConfig {
    const sourceCodec = (options?.sourceCodec || 'g711') as SourceCodec;
    const targetCodec = (options?.targetCodec || this.getRecommendedTargetCodec(sourceCodec)) as TargetCodec;

    return {
      source: {
        codec: sourceCodec,
        sampleRate: options?.sourceSampleRate || 8000,
        channels: options?.sourceChannels || 1,
        bitrate: options?.sourceBitrate
      },
      target: {
        codec: targetCodec,
        sampleRate: options?.targetSampleRate || DEFAULT_TARGET_SAMPLE_RATE,
        channels: options?.targetChannels || DEFAULT_TARGET_CHANNELS,
        bitrate: options?.targetBitrate
      },
      mode: options?.mode || 'full',
      startTime: options?.startTime,
      duration: options?.duration
    };
  }

  /**
   * Validate configuration
   */
  private validateConfig(config: TranscodingConfig): void {
    this.validateSourceEncoding(config.source);
    this.validateTargetEncoding(config.target);

    // Check codec compatibility
    const compatibility = CODEC_COMPATIBILITY[config.source.codec];
    if (compatibility && !compatibility.compatible.includes(config.target.codec)) {
      throw new TranscodingCodecError(
        `Target codec ${config.target.codec} is not compatible with source codec ${config.source.codec}`,
        config.source.codec,
        config.target.codec
      );
    }
  }

  /**
   * Validate source encoding
   */
  private validateSourceEncoding(encoding: { codec: SourceCodec; bitrate?: number }): void {
    if (encoding.codec === 'g726' && !encoding.bitrate) {
      throw new TranscodingValidationError(
        'Source bitrate is required for G.726 codec',
        'sourceBitrate'
      );
    }
  }

  /**
   * Validate target encoding
   */
  private validateTargetEncoding(encoding: { codec: TargetCodec }): void {
    // Target codec validation is handled by FFmpeg service
    // Additional validation can be added here if needed
  }

  /**
   * Generate output path
   */
  private generateOutputPath(inputPath: string, targetCodec: TargetCodec): string {
    const dir = path.dirname(inputPath);
    const ext = path.extname(inputPath);
    const baseName = path.basename(inputPath, ext);

    const codecExtensions: Record<TargetCodec, string> = {
      aac: '.aac',
      mp3: '.mp3',
      opus: '.opus',
      pcm_s16le: '.wav'
    };

    const outputExt = codecExtensions[targetCodec] || '.aac';

    return path.join(dir, `${baseName}_${targetCodec}${outputExt}`);
  }
}

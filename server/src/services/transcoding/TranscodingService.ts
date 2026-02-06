/**
 * Transcoding Service – Codec Interoperability Layer
 * Converts PCM and telecom codecs into browser-playable formats
 */

import type { ITranscodingService } from '../../interfaces/transcoding/ITranscodingService.js';
import type { IFfmpegService } from '../../interfaces/transcoding/IFfmpegService.js';
import type {
  TranscodingResult,
  ChunkTranscodingParams,
  TranscodingConfig,
  SourceCodec,
  TargetCodec
} from '../../types/transcoding/TranscodingTypes.js';
import { TranscodingValidationError, TranscodingCodecError, TranscodingFileError } from '../../errors/transcoding/TranscodingErrors.js';
import { promises as fs } from 'fs';
import { existsSync } from 'fs';
import type { AudioCodec } from '../../types/ffmpeg/FFmpegTypes.js';

/**
 * Default target codec (browser-playable)
 */
const DEFAULT_TARGET_CODEC: TargetCodec = 'aac';

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

}


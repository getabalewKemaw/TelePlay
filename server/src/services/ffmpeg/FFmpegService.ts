/**
 * FFmpeg Service - Core Execution Layer
 * Single, safe, controlled interface to FFmpeg
 * Production-ready service following SOLID principles
 */

import type { IFfmpegService } from './interfaces/IFfmpegService.js';
import type { IFfmpegExecutor } from './interfaces/IFfmpegExecutor.js';
import type {
  DecodeParams,
  EncodeParams,
  TranscodeParams,
  ConvertParams,
  FFmpegExecutionResult
} from './types/FFmpegTypes.js';
import { FFmpegValidator } from './validators/FFmpegValidator.js';
import { FFmpegFileError, FFmpegValidationError } from './errors/FFmpegErrors.js';
import { FFmpegExecutor } from './implementations/FFmpegExecutor.js';

/**
 * FFmpeg Service Implementation
 * 
 * Responsibilities:
 * - Single gateway to FFmpeg execution
 * - Parameter validation
 * - High-level operation orchestration
 * - Error handling and transformation
 * - Safe concurrent execution
 */
export class FFmpegService implements IFfmpegService {
  private readonly executor: IFfmpegExecutor;

  /**
   * Constructor with dependency injection
   * @param executor - FFmpeg executor implementation (defaults to FFmpegExecutor)
   */
  constructor(executor?: IFfmpegExecutor) {
    this.executor = executor ?? new FFmpegExecutor();
  }

  /**
   * Decode audio file
   */
  async decode(params: DecodeParams): Promise<FFmpegExecutionResult> {
    // Validate input
    FFmpegValidator.validateFilePath(params.input.path, 'input');
    FFmpegValidator.validateFilePath(params.output.path, 'output');
    
    await FFmpegValidator.validateInputFile(params.input.path);
    await FFmpegValidator.validateOutputPath(params.output.path);

    if (params.codec) {
      FFmpegValidator.validateCodec(params.codec);
      
      // For telecom codecs, validate sampleRate and channels are provided
      if (params.codec === 'g711' || params.codec === 'g726' || params.codec === 'g728') {
        if (!params.sampleRate) {
          throw new FFmpegValidationError(
            `Sample rate is required for ${params.codec} decoding`,
            'sampleRate'
          );
        }
        if (!params.channels) {
          throw new FFmpegValidationError(
            `Channels are required for ${params.codec} decoding`,
            'channels'
          );
        }
        FFmpegValidator.validateSampleRate(params.sampleRate);
        FFmpegValidator.validateChannels(params.channels);
        
        // G.726 requires bitrate
        if (params.codec === 'g726' && !params.bitrate) {
          throw new FFmpegValidationError(
            'Bitrate is required for G.726 decoding (8, 16, 24, or 32 kbps)',
            'bitrate'
          );
        }
        if (params.bitrate) {
          FFmpegValidator.validateBitrate(params.bitrate);
        }
      }
    }

    if (params.sampleRate) {
      FFmpegValidator.validateSampleRate(params.sampleRate);
    }
    if (params.channels) {
      FFmpegValidator.validateChannels(params.channels);
    }
    if (params.bitrate) {
      FFmpegValidator.validateBitrate(params.bitrate);
    }

    // Build command options
    // For decoding, we need to specify input format/codec before -i
    const additionalArgs: string[] = [];
    
    // For telecom codecs, we need to specify input format and parameters BEFORE -i
    if (params.codec && (params.codec === 'g711' || params.codec === 'g726' || params.codec === 'g728')) {
      // Map codec to input format
      const inputFormatMap: Record<string, string> = {
        g711: 'mulaw',
        g726: 'g726',
        g728: 'g728'
      };
      
      additionalArgs.push('-f', inputFormatMap[params.codec]);
      
      // For G.726, specify bitrate before input (required for decoding)
      if (params.codec === 'g726' && params.bitrate) {
        // G.726 bitrate must be specified before -i for input
        additionalArgs.push('-b:a', `${params.bitrate}k`);
      }
    } else if (params.input.format) {
      additionalArgs.push('-f', params.input.format);
    }

    const commandOptions = {
      input: params.input.path,
      output: params.output.path,
      // For decoding, we don't set output codec, let FFmpeg auto-detect or use format
      codec: undefined, // Don't set output codec for decoding
      sampleRate: params.sampleRate,
      channels: params.channels,
      bitrate: undefined, // Bitrate is only for input in decode, handled in additionalArgs
      format: params.output.format || 'wav', // Default to WAV for output
      additionalArgs: additionalArgs.length > 0 ? additionalArgs : undefined
    };

    try {
      return await this.executor.execute(commandOptions);
    } catch (error) {
      this.handleExecutionError(error, params.input.path, params.output.path);
      throw error;
    }
  }

  /**
   * Encode audio file
   */
  async encode(params: EncodeParams): Promise<FFmpegExecutionResult> {
    // Validate input
    FFmpegValidator.validateFilePath(params.input.path, 'input');
    FFmpegValidator.validateFilePath(params.output.path, 'output');
    
    await FFmpegValidator.validateInputFile(params.input.path);
    await FFmpegValidator.validateOutputPath(params.output.path);
    FFmpegValidator.validateEncodingParams(params.encoding);

    // Build command options
    const commandOptions = {
      input: params.input.path,
      output: params.output.path,
      codec: params.encoding.codec,
      sampleRate: params.encoding.sampleRate,
      channels: params.encoding.channels,
      bitrate: params.encoding.bitrate,
      format: params.output.format,
      additionalArgs: params.input.format ? ['-f', params.input.format] : undefined
    };

    try {
      return await this.executor.execute(commandOptions);
    } catch (error) {
      this.handleExecutionError(error, params.input.path, params.output.path);
      throw error;
    }
  }

  /**
   * Transcode audio file
   */
  async transcode(params: TranscodeParams): Promise<FFmpegExecutionResult> {
    // Validate input
    FFmpegValidator.validateFilePath(params.input.path, 'input');
    FFmpegValidator.validateFilePath(params.output.path, 'output');
    
    await FFmpegValidator.validateInputFile(params.input.path);
    await FFmpegValidator.validateOutputPath(params.output.path);
    FFmpegValidator.validateEncodingParams(params.sourceEncoding);
    FFmpegValidator.validateEncodingParams(params.targetEncoding);

    // Build command options
    const commandOptions = {
      input: params.input.path,
      output: params.output.path,
      codec: params.targetEncoding.codec,
      sampleRate: params.targetEncoding.sampleRate,
      channels: params.targetEncoding.channels,
      bitrate: params.targetEncoding.bitrate,
      format: params.output.format,
      additionalArgs: [
        ...(params.input.format ? ['-f', params.input.format] : []),
        '-acodec', this.mapCodecToFFmpeg(params.sourceEncoding.codec),
        '-ar', params.sourceEncoding.sampleRate.toString(),
        '-ac', params.sourceEncoding.channels.toString()
      ]
    };

    try {
      return await this.executor.execute(commandOptions);
    } catch (error) {
      this.handleExecutionError(error, params.input.path, params.output.path);
      throw error;
    }
  }

  /**
   * Convert audio file format
   */
  async convert(params: ConvertParams): Promise<FFmpegExecutionResult> {
    // Validate input
    FFmpegValidator.validateFilePath(params.input.path, 'input');
    FFmpegValidator.validateFilePath(params.output.path, 'output');
    
    await FFmpegValidator.validateInputFile(params.input.path);
    await FFmpegValidator.validateOutputPath(params.output.path);

    if (params.encoding) {
      FFmpegValidator.validateEncodingParams(params.encoding);
    }

    // Build command options
    const commandOptions = {
      input: params.input.path,
      output: params.output.path,
      format: params.targetFormat,
      codec: params.encoding?.codec,
      sampleRate: params.encoding?.sampleRate,
      channels: params.encoding?.channels,
      bitrate: params.encoding?.bitrate,
      additionalArgs: params.input.format ? ['-f', params.input.format] : undefined
    };

    try {
      return await this.executor.execute(commandOptions);
    } catch (error) {
      this.handleExecutionError(error, params.input.path, params.output.path);
      throw error;
    }
  }

  /**
   * Check if FFmpeg is available
   */
  async isAvailable(): Promise<boolean> {
    return this.executor.isAvailable();
  }

  /**
   * Get FFmpeg version
   */
  async getVersion(): Promise<string> {
    return this.executor.getVersion();
  }

  /**
   * Handle execution errors and transform them appropriately
   */
  private handleExecutionError(
    error: unknown,
    inputPath: string,
    outputPath: string
  ): void {
    // Error transformation is handled by the executor
    // This method can be extended for additional error handling logic
    if (error instanceof Error && error.message.includes('ENOENT')) {
      throw new FFmpegFileError(
        `File not found: ${inputPath}`,
        inputPath
      );
    }
  }

  /**
   * Map internal codec names to FFmpeg codec names
   * (Delegated to executor, but kept for service-level mapping if needed)
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
}

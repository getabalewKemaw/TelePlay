
/**
 * FFmpeg Parameter Validators
 * Validates input parameters before FFmpeg execution
 */

import type { AudioCodec,SampleRate,ChannelConfig,AudioEncodingParams } from '../../types/ffmpeg/FFmpegTypes.js';
// import { FFmpegValidationError } from '../errors/FFmpegErrors.js';
import { FFmpegValidationError } from '../../errors/ffmpeg/FFmpegErrors.js';
import { promises as fs } from 'fs';
import { existsSync } from 'fs';

import { SUPPORTED_CHANNELS,SUPPORTED_CODECS,SUPPORTED_SAMPLE_RATES } from '../../constants/ffmpeg/index.js';
import path from 'path';

/**
 * Validator class for FFmpeg parameters
 */
export class FFmpegValidator {
  static validateCodec(codec: string): asserts codec is AudioCodec {
    if (!SUPPORTED_CODECS.has(codec as AudioCodec)) {
      throw new FFmpegValidationError(
        `Unsupported codec: ${codec}. Supported codecs: ${Array.from(SUPPORTED_CODECS).join(', ')}`,
        'codec'
      );
    }
  }
  static validateSampleRate(sampleRate: number): asserts sampleRate is SampleRate {
    if (!SUPPORTED_SAMPLE_RATES.has(sampleRate as SampleRate)) {
      throw new FFmpegValidationError(
        `Unsupported sample rate: ${sampleRate}Hz. Supported rates: ${Array.from(SUPPORTED_SAMPLE_RATES).join(', ')}Hz`,
        'sampleRate'
      );
    }
  }
  static validateChannels(channels: number): asserts channels is ChannelConfig {
    if (!SUPPORTED_CHANNELS.has(channels as ChannelConfig)) {
      throw new FFmpegValidationError(
        `Unsupported channel count: ${channels}. Supported: ${Array.from(SUPPORTED_CHANNELS).join(', ')}`,
        'channels'
      );
    }
  }

  static validateBitrate(bitrate: number | undefined): void {
    if (bitrate !== undefined) {
      if (bitrate <= 0 || bitrate > 10000) {
        throw new FFmpegValidationError(
          `Invalid bitrate: ${bitrate}kbps. Must be between 1 and 10000 kbps`,
          'bitrate'
        );
      }
    }
  }
  static validateEncodingParams(params: AudioEncodingParams): void {
    this.validateCodec(params.codec);
    this.validateSampleRate(params.sampleRate);
    this.validateChannels(params.channels);
    this.validateBitrate(params.bitrate);
  }

  /**
   * Validates file path exists and is accessible
   */
  static async validateInputFile(filePath: string): Promise<void> {
    if (!filePath || typeof filePath !== 'string') {
      throw new FFmpegValidationError('Input file path is required and must be a string', 'input');
    }

    if (!existsSync(filePath)) {
      throw new FFmpegValidationError(
        `Input file does not exist: ${filePath}`,
        'input'
      );
    }

    try {
      await fs.access(filePath, fs.constants.R_OK);
    } catch (error) {
      throw new FFmpegValidationError(
        `Input file is not readable: ${filePath}`,
        'input'
      );
    }
  }
  static async validateOutputPath(filePath: string): Promise<void> {
    if (!filePath || typeof filePath !== 'string') {
      throw new FFmpegValidationError('Output file path is required and must be a string', 'output');
    }
    const outputDir = path.dirname(filePath);
  
    if (!existsSync(outputDir)) {
      throw new FFmpegValidationError(
        `Output directory does not exist: ${outputDir}`,
        'output'
      );
    }

    try {
      await fs.access(outputDir, fs.constants.W_OK);
    } catch (error) {
      throw new FFmpegValidationError(
        `Output directory is not writable: ${outputDir}`,
        'output'
      );
    }
  }

  /**
   * Validates file path format
   */
  static validateFilePath(filePath: string, fieldName: string): void {
    if (!filePath || typeof filePath !== 'string') {
      throw new FFmpegValidationError(
        `${fieldName} file path is required and must be a string`,
        fieldName
      );
    }

    if (path.isAbsolute(filePath) && !filePath.match(/^[a-zA-Z]:/)) {
      // Basic validation for absolute paths
        throw new FFmpegValidationError(
          `Invalid file path format: ${filePath}`,
          fieldName
        );
    }
  }
}

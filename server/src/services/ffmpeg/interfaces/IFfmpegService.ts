/**
 * FFmpeg Service Interface
 * Main service interface for FFmpeg operations
 */

import type {
  DecodeParams,
  EncodeParams,
  TranscodeParams,
  ConvertParams,
  FFmpegExecutionResult
} from '../types/FFmpegTypes.js';

/**
 * Main FFmpeg service interface
 * Provides high-level operations for audio processing
 */
export interface IFfmpegService {
  /**
   * Decode audio file to raw PCM or another format
   * @param params - Decode parameters
   * @returns Promise resolving to execution result
   */
  decode(params: DecodeParams): Promise<FFmpegExecutionResult>;

  /**
   * Encode audio file with specified encoding parameters
   * @param params - Encode parameters
   * @returns Promise resolving to execution result
   */
  encode(params: EncodeParams): Promise<FFmpegExecutionResult>;

  /**
   * Transcode audio from one codec/format to another
   * @param params - Transcode parameters
   * @returns Promise resolving to execution result
   */
  transcode(params: TranscodeParams): Promise<FFmpegExecutionResult>;

  /**
   * Convert audio file format
   * @param params - Convert parameters
   * @returns Promise resolving to execution result
   */
  convert(params: ConvertParams): Promise<FFmpegExecutionResult>;

  /**
   * Check if FFmpeg is available
   * @returns Promise resolving to true if available
   */
  isAvailable(): Promise<boolean>;

  /**
   * Get FFmpeg version
   * @returns Promise resolving to version string
   */
  getVersion(): Promise<string>;
}

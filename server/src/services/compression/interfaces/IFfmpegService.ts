/**
 * FFmpeg Service Interface (for dependency injection)
 * Re-exported from FFmpeg service to avoid circular dependencies
 */

import type { FFmpegExecutionResult } from '../../ffmpeg/types/FFmpegTypes.js';
import type { EncodeParams } from '../../ffmpeg/types/FFmpegTypes.js';

/**
 * Minimal interface for FFmpeg service
 * Used by compression service to encode/compress media
 */
export interface IFfmpegService {
  /**
   * Encode audio file with specified encoding parameters
   */
  encode(params: EncodeParams): Promise<FFmpegExecutionResult>;

  /**
   * Check if FFmpeg is available
   */
  isAvailable(): Promise<boolean>;
}

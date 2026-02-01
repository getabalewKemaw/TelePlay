/**
 * FFmpeg Service Interface (for dependency injection)
 * Re-exported from FFmpeg service to avoid circular dependencies
 */

import type { FFmpegExecutionResult } from '../../ffmpeg/types/FFmpegTypes.js';
import type { TranscodeParams } from '../../ffmpeg/types/FFmpegTypes.js';

/**
 * Minimal interface for FFmpeg service
 * Used by transcoding service to perform transcoding operations
 */
export interface IFfmpegService {
  /**
   * Transcode audio from one codec/format to another
   */
  transcode(params: TranscodeParams): Promise<FFmpegExecutionResult>;

  /**
   * Check if FFmpeg is available
   */
  isAvailable(): Promise<boolean>;
}

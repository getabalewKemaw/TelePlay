/**
 * FFmpeg Service - Public API
 * Main entry point for FFmpeg service
 */

export { FFmpegService } from './FFmpegService.js';
export { FFmpegExecutor } from './implementations/FFmpegExecutor.js';
export { FFmpegValidator } from '../../validator/ffmpeg/FFmpegValidator.js';

// Export interfaces
export type { IFfmpegService } from '../../interfaces/ffmpeg/IFfmpegService.js';
export type { IFfmpegExecutor } from '../../interfaces/ffmpeg/IFfmpegExecutor.js';

// Export types
export type {
  AudioCodec,
  SampleRate,
  ChannelConfig,
  FFmpegOperation,
  FileConfig,
  AudioEncodingParams,
  DecodeParams,
  EncodeParams,
  TranscodeParams,
  ConvertParams,
  FFmpegExecutionResult,
  FFmpegCommandOptions
} from '../../types/ffmpeg/FFmpegTypes.js';

// Export errors
export {
  FFmpegError,
  FFmpegValidationError,
  FFmpegExecutionError,
  FFmpegFileError,
  FFmpegCodecError,
  FFmpegTimeoutError
} from '../../errors/ffmpeg/FFmpegErrors.js';


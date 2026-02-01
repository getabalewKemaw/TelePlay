/**
 * FFmpeg Service - Public API
 * Main entry point for FFmpeg service
 */

export { FFmpegService } from './FFmpegService.js';
export { FFmpegExecutor } from './implementations/FFmpegExecutor.js';
export { FFmpegValidator } from './validators/FFmpegValidator.js';

// Export interfaces
export type { IFfmpegService } from './interfaces/IFfmpegService.js';
export type { IFfmpegExecutor } from './interfaces/IFfmpegExecutor.js';

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
} from './types/FFmpegTypes.js';

// Export errors
export {
  FFmpegError,
  FFmpegValidationError,
  FFmpegExecutionError,
  FFmpegFileError,
  FFmpegCodecError,
  FFmpegTimeoutError
} from './errors/FFmpegErrors.js';

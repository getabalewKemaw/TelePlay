/**
 * Transcoding Service - Public API
 * Main entry point for Transcoding service
 */

export { TranscodingService } from './TranscodingService.js';

// Export interfaces
export type { ITranscodingService } from '../../interfaces/transcoding/ITranscodingService.js';
export type { IFfmpegService } from '../../interfaces/transcoding/IFfmpegService.js';

// Export types
export type {
  SourceCodec,
  TargetCodec,
  TranscodingMode,
  SourceEncoding,
  TargetEncoding,
  TranscodingConfig,
  TranscodingResult,
  ChunkTranscodingParams,
  TranscodingOptions,
  TranscodingPipelineStage,
  CodecCompatibility
} from '../../types/transcoding/TranscodingTypes.js';

// Export errors
export {
  TranscodingError,
  TranscodingValidationError,
  TranscodingCodecError,
  TranscodingFileError,
  TranscodingChunkError
} from '../../errors/transcoding/TranscodingErrors.js';


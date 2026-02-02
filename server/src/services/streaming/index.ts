/**
 * Streaming Preparation Service - Public API
 * Main entry point for Streaming Preparation service
 */

export { StreamingPreparationService } from './StreamingPreparationService.js';

// Export interfaces
export type { IStreamingPreparationService } from '../../interfaces/streaming/IStreamingPreparationService.js';
export type { IChunkingService } from '../../interfaces/streaming/IChunkingService.js';
export type { ISegmentationService } from '../../interfaces/streaming/ISegmentationService.js';
export type { ITranscodingService } from '../../interfaces/streaming/ITranscodingService.js';
export type { ICompressionService } from '../../interfaces/streaming/ICompressionService.js';

// Export types
export type {
  TransportProtocol,
  PlaybackState,
  PlaybackAction,
  StreamingMode,
  ChunkStatus,
  PreparedChunk,
  PreparedSegment,
  StreamingSession,
  PlaybackControlRequest,
  PlaybackControlResponse,
  StreamingPreparationOptions,
  StreamMetadata,
  StreamEndpoint
} from '../../types/streaming/StreamingTypes.js';

// Export errors
export {
  StreamingError,
  StreamingValidationError,
  StreamingSessionError,
  StreamingPlaybackError,
  StreamingPreparationError
} from '../../errors/streaming/StreamingErrors.js';


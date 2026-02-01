/**
 * Streaming Preparation Service - Public API
 * Main entry point for Streaming Preparation service
 */

export { StreamingPreparationService } from './StreamingPreparationService.js';

// Export interfaces
export type { IStreamingPreparationService } from './interfaces/IStreamingPreparationService.js';
export type { IChunkingService } from './interfaces/IChunkingService.js';
export type { ISegmentationService } from './interfaces/ISegmentationService.js';
export type { ITranscodingService } from './interfaces/ITranscodingService.js';
export type { ICompressionService } from './interfaces/ICompressionService.js';

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
} from './types/StreamingTypes.js';

// Export errors
export {
  StreamingError,
  StreamingValidationError,
  StreamingSessionError,
  StreamingPlaybackError,
  StreamingPreparationError
} from './errors/StreamingErrors.js';

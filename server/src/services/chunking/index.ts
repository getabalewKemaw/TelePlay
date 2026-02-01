/**
 * Chunking Service - Public API
 * Main entry point for Chunking service
 */

export { ChunkingService } from './ChunkingService.js';
export { FFprobeMetadataProvider } from './implementations/FFprobeMetadataProvider.js';

// Export interfaces
export type { IChunkingService } from './interfaces/IChunkingService.js';
export type { IMediaMetadataProvider } from './interfaces/IMediaMetadataProvider.js';

// Export types
export type {
  ChunkMetadata,
  ChunkingConfig,
  ChunkingResult,
  SeekParams,
  SeekResult,
  MediaMetadata,
  ChunkingOptions
} from './types/ChunkingTypes.js';

// Export errors
export {
  ChunkingError,
  ChunkingValidationError,
  ChunkingFileError,
  ChunkingMetadataError,
  ChunkingSeekError
} from './errors/ChunkingErrors.js';

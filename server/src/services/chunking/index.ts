/**
 * Main entry point for Chunking service
 */

export { ChunkingService } from './ChunkingService.js';
export { FFprobeMetadataProvider } from './implementations/FFprobeMetadataProvider.js';
export type { IChunkingService } from '../../interfaces/chunking/IChunkingService.js';
export type { IMediaMetadataProvider } from '../../interfaces/chunking/IMediaMetadataProvider.js';
export type {
  ChunkMetadata,
  ChunkingConfig,
  ChunkingResult,
  SeekParams,
  SeekResult,
  MediaMetadata,
  ChunkingOptions
} from '../../types/chunking/ChunkingTypes.js';
export {
  ChunkingError,
  ChunkingValidationError,
  ChunkingFileError,
  ChunkingMetadataError,
  ChunkingSeekError
} from '../../errors/chunking/ChunkingErrors.js';

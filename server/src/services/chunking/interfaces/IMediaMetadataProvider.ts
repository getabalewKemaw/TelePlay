/**
 * Media Metadata Provider Interface
 * Provides media file metadata (duration, size, etc.)
 * Allows for different implementations (FFprobe, file system, etc.)
 */

import type { MediaMetadata } from '../types/ChunkingTypes.js';

/**
 * Interface for retrieving media metadata
 * This abstraction allows for:
 * - Different metadata sources (FFprobe, file system, database)
 * - Easy testing with mock implementations
 * - Future microservice extraction
 */
export interface IMediaMetadataProvider {
  /**
   * Get metadata for a media file
   * @param filePath - Path to the media file
   * @returns Promise resolving to media metadata
   */
  getMetadata(filePath: string): Promise<MediaMetadata>;

  /**
   * Check if the provider is available
   * @returns Promise resolving to true if available
   */
  isAvailable(): Promise<boolean>;
}

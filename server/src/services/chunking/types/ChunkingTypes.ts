/**
 * Chunking Service Types
 * Type definitions for media chunking operations
 */

/**
 * Chunk metadata for a single media chunk
 */
export interface ChunkMetadata {
  /**
   * Zero-based index of the chunk
   */
  index: number;

  /**
   * Start time of the chunk in seconds
   */
  startTime: number;

  /**
   * End time of the chunk in seconds (exclusive)
   */
  endTime: number;

  /**
   * Duration of the chunk in seconds
   */
  duration: number;

  /**
   * Byte offset where this chunk starts in the original file (if available)
   */
  byteOffset?: number;

  /**
   * Size of the chunk in bytes (if available)
   */
  byteSize?: number;

  /**
   * File path for this chunk (if chunks are written to disk)
   */
  filePath?: string;
}

/**
 * Chunking configuration
 */
export interface ChunkingConfig {
  /**
   * Duration of each chunk in seconds
   * Default: 120 (2 minutes)
   */
  chunkDuration: number;

  /**
   * Total duration of the media file in seconds
   */
  totalDuration: number;

  /**
   * Whether to generate chunk files on disk
   * Default: false (metadata only)
   */
  generateFiles?: boolean;

  /**
   * Output directory for chunk files (required if generateFiles is true)
   */
  outputDirectory?: string;

  /**
   * Base filename for chunk files (without extension)
   */
  baseFilename?: string;
}

/**
 * Chunking result containing all chunk metadata
 */
export interface ChunkingResult {
  /**
   * Array of chunk metadata, sorted by index
   */
  chunks: ChunkMetadata[];

  /**
   * Total number of chunks
   */
  totalChunks: number;

  /**
   * Total duration of the media in seconds
   */
  totalDuration: number;

  /**
   * Chunk duration in seconds
   */
  chunkDuration: number;

  /**
   * Duration of the last chunk (may be shorter than chunkDuration)
   */
  lastChunkDuration: number;
}

/**
 * Seek operation parameters
 */
export interface SeekParams {
  /**
   * Target time position in seconds
   */
  time: number;

  /**
   * Whether to find the exact chunk or nearest chunk
   * Default: false (nearest)
   */
  exact?: boolean;
}

/**
 * Seek result
 */
export interface SeekResult {
  /**
   * The chunk that contains or is nearest to the target time
   */
  chunk: ChunkMetadata;

  /**
   * Offset within the chunk in seconds
   * (time - chunk.startTime)
   */
  offsetInChunk: number;

  /**
   * Whether the exact time was found in a chunk
   */
  exact: boolean;
}

/**
 * Media metadata (from FFprobe or similar)
 */
export interface MediaMetadata {
  /**
   * Total duration in seconds
   */
  duration: number;

  /**
   * File size in bytes
   */
  fileSize?: number;

  /**
   * Format information
   */
  format?: string;

  /**
   * Codec information
   */
  codec?: string;

  /**
   * Bitrate in bits per second
   */
  bitrate?: number;
}

/**
 * Chunking operation options
 */
export interface ChunkingOptions {
  /**
   * Chunk duration in seconds
   * Default: 120 (2 minutes)
   */
  chunkDuration?: number;

  /**
   * Whether to generate physical chunk files
   * Default: false
   */
  generateFiles?: boolean;

  /**
   * Output directory for chunk files
   */
  outputDirectory?: string;

  /**
   * Base filename for chunk files
   */
  baseFilename?: string;
}

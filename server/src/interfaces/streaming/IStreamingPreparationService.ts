/**
 * Streaming Preparation Service Interface
 * Main service interface for streaming preparation operations
 */

import type {
  StreamingSession,
  PreparedChunk,
  PreparedSegment,
  PlaybackControlRequest,
  PlaybackControlResponse,
  StreamingPreparationOptions,
  StreamMetadata,
  StreamEndpoint
} from '../../types/streaming/StreamingTypes.js';

/**
 * Main streaming preparation service interface
 * Prepares processed chunks for network streaming
 */
export interface IStreamingPreparationService {
  /**
   * Create a streaming session
   * @param filePath - Path to media file
   * @param options - Streaming preparation options
   * @returns Promise resolving to streaming session
   */
  createSession(filePath: string, options?: StreamingPreparationOptions): Promise<StreamingSession>;

  /**
   * Prepare chunks for streaming
   * @param sessionId - Session ID
   * @param chunkIndices - Indices of chunks to prepare (optional, prepares all if not provided)
   * @returns Promise resolving to prepared chunks
   */
  prepareChunks(sessionId: string, chunkIndices?: number[]): Promise<PreparedChunk[]>;

  /**
   * Prepare segments for streaming
   * @param sessionId - Session ID
   * @param segmentIndices - Indices of segments to prepare (optional, prepares all if not provided)
   * @returns Promise resolving to prepared segments
   */
  prepareSegments(sessionId: string, segmentIndices?: number[]): Promise<PreparedSegment[]>;

  /**
   * Handle playback control (play, pause, seek, etc.)
   * @param sessionId - Session ID
   * @param request - Playback control request
   * @returns Promise resolving to playback control response
   */
  handlePlaybackControl(sessionId: string, request: PlaybackControlRequest): Promise<PlaybackControlResponse>;

  /**
   * Get chunks needed for current playback position
   * @param sessionId - Session ID
   * @param time - Current time in seconds
   * @returns Promise resolving to chunks to load
   */
  getChunksForTime(sessionId: string, time: number): Promise<PreparedChunk[]>;

  /**
   * Get stream endpoint information
   * @param sessionId - Session ID
   * @param chunkIndex - Chunk index (optional, for chunk-specific endpoint)
   * @returns Promise resolving to stream endpoint
   */
  getStreamEndpoint(sessionId: string, chunkIndex?: number): Promise<StreamEndpoint>;

  /**
   * Get stream metadata
   * @param sessionId - Session ID
   * @returns Promise resolving to stream metadata
   */
  getStreamMetadata(sessionId: string): Promise<StreamMetadata>;

  /**
   * Get session by ID
   * @param sessionId - Session ID
   * @returns Promise resolving to session or undefined if not found
   */
  getSession(sessionId: string): Promise<StreamingSession | undefined>;

  /**
   * Cleanup session
   * @param sessionId - Session ID
   * @returns Promise resolving when cleanup is complete
   */
  cleanupSession(sessionId: string): Promise<void>;
}

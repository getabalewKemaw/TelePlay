/**
 * Streaming Preparation Service Types
 * Type definitions for streaming preparation operations
 */



import type { ChunkMetadata } from '../chunking/ChunkingTypes.js';
import type { SegmentMetadata } from '../segementation/SegmentationTypes.js';
/**
 * 
 * Transport protocol type
 */
export type TransportProtocol = 'http' | 'websocket' | 'rtp' | 'webrtc';

/**
 * Playback state
 */
export type PlaybackState = 'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'seeking' | 'ended' | 'error';

/**
 * Playback control action
 */
export type PlaybackAction = 'play' | 'pause' | 'seek' | 'fast-forward' | 'rewind' | 'stop';

/**
 * Streaming mode
 */
export type StreamingMode = 'file-based' | 'live';

/**
 * Chunk preparation status
 */
export type ChunkStatus = 'pending' | 'processing' | 'ready' | 'streaming' | 'completed' | 'error';

/**
 * Prepared chunk for streaming
 */
export interface PreparedChunk {
  /**
   * Original chunk metadata
   */
  chunk: ChunkMetadata;

  /**
   * Transcoding result (if transcoded)
   */
  transcodedPath?: string;

  /**
   * Compression result (if compressed)
   */
  compressedPath?: string;

  /**
   * Final path to use for streaming
   */
  streamPath: string;

  /**
   * Status of preparation
   */
  status: ChunkStatus;

  /**
   * Size of prepared chunk in bytes
   */
  size: number;

  /**
   * MIME type for HTTP streaming
   */
  mimeType?: string;

  /**
   * Preparation timestamp
   */
  preparedAt: number;
}

/**
 * Prepared segment for streaming
 */
export interface PreparedSegment {
  /**
   * Original segment metadata
   */
  segment: SegmentMetadata;

  /**
   * Prepared chunks in this segment
   */
  chunks: PreparedChunk[];

  /**
   * Status of segment preparation
   */
  status: ChunkStatus;

  /**
   * Total size of prepared segment
   */
  totalSize: number;

  /**
   * Ready for streaming
   */
  isReady: boolean;
}

/**
 * Streaming session
 */
export interface StreamingSession {
  /**
   * Session ID
   */
  sessionId: string;

  /**
   * Media file path
   */
  filePath: string;

  /**
   * Current playback state
   */
  state: PlaybackState;

  /**
   * Current playback position in seconds
   */
  currentTime: number;

  /**
   * Prepared segments
   */
  preparedSegments: PreparedSegment[];

  /**
   * Transport protocol
   */
  transport: TransportProtocol;

  /**
   * Streaming mode
   */
  mode: StreamingMode;

  /**
   * Session start time
   */
  startedAt: number;

  /**
   * Last activity timestamp
   */
  lastActivity: number;
}

/**
 * Playback control request
 */
export interface PlaybackControlRequest {
  /**
   * Action to perform
   */
  action: PlaybackAction;

  /**
   * Target time for seek/ff/rewind (in seconds)
   */
  targetTime?: number;

  /**
   * Fast-forward/rewind amount (in seconds)
   */
  amount?: number;
}

/**
 * Playback control response
 */
export interface PlaybackControlResponse {
  /**
   * New playback state
   */
  state: PlaybackState;

  /**
   * Current playback position
   */
  currentTime: number;

  /**
   * Chunks to load for new position
   */
  chunksToLoad: PreparedChunk[];

  /**
   * Segments to load for new position
   */
  segmentsToLoad: PreparedSegment[];

  /**
   * Success status
   */
  success: boolean;

  /**
   * Error message (if any)
   */
  error?: string;
}

/**
 * Streaming preparation options
 */
export interface StreamingPreparationOptions {
  /**
   * Transport protocol
   */
  transport?: TransportProtocol;

  /**
   * Streaming mode
   */
  mode?: StreamingMode;

  /**
   * Target codec for transcoding
   */
  targetCodec?: string;

  /**
   * Compression level (if compression needed)
   */
  compressionLevel?: string;

  /**
   * Whether to pre-transcode chunks
   */
  preTranscode?: boolean;

  /**
   * Whether to pre-compress chunks
   */
  preCompress?: boolean;

  /**
   * Buffer size in seconds
   */
  bufferSize?: number;
}

/**
 * Stream metadata
 */
export interface StreamMetadata {
  /**
   * Stream ID
   */
  streamId: string;

  /**
   * Media file path
   */
  filePath: string;

  /**
   * Total duration in seconds
   */
  duration: number;

  /**
   * Codec information
   */
  codec: string;

  /**
   * Sample rate
   */
  sampleRate: number;

  /**
   * Channels
   */
  channels: number;

  /**
   * Bitrate
   */
  bitrate?: number;

  /**
   * MIME type
   */
  mimeType: string;
}

/**
 * Stream endpoint information
 */
export interface StreamEndpoint {
  /**
   * Endpoint URL
   */
  url: string;

  /**
   * Transport protocol
   */
  protocol: TransportProtocol;

  /**
   * MIME type
   */
  mimeType: string;

  /**
   * Additional headers (for HTTP)
   */
  headers?: Record<string, string>;
}

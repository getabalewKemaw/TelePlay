import type { ChunkMetadata } from '../chunking/ChunkingTypes.js';
import type { SegmentMetadata } from '../segmentation/SegmentationTypes.js';
export type TransportProtocol = 'http' | 'websocket' | 'rtp' | 'webrtc';
export type PlaybackState = 'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'seeking' | 'ended' | 'error';
export type PlaybackAction = 'play' | 'pause' | 'seek' | 'fast-forward' | 'rewind' | 'stop';
export type StreamingMode = 'file-based' | 'live';
export type ChunkStatus = 'pending' | 'processing' | 'ready' | 'streaming' | 'completed' | 'error';
export interface PreparedChunk {
  chunk: ChunkMetadata;
  transcodedPath?: string;
  compressedPath?: string;
  streamPath: string;
  status: ChunkStatus;
  size: number;
  mimeType?: string;
  preparedAt: number;
}
export interface PreparedSegment {
  segment: SegmentMetadata;
  chunks: PreparedChunk[];
  status: ChunkStatus;
  totalSize: number;
  isReady: boolean;
}
export interface StreamingSession {
  sessionId: string;
  filePath: string;
  state: PlaybackState;
  currentTime: number;
  preparedSegments: PreparedSegment[];
  transport: TransportProtocol;
  mode: StreamingMode
  inputCodec?: string;
  sampleRate?: number;
  channels?: number;
  bitrate?: number;
  outputFormat?: 'wav' | 'mp3';
  saveOutputPath?: string;
  fileId?: string;
  startedAt: number;
  lastActivity: number;
}
export interface PlaybackControlRequest {
  action: PlaybackAction;
  targetTime?: number;
  amount?: number;
}
export interface PlaybackControlResponse {
  state: PlaybackState;
  currentTime: number;
  chunksToLoad: PreparedChunk[];
  segmentsToLoad: PreparedSegment[];
  success: boolean;
  error?: string;
}
export interface StreamingPreparationOptions {
  transport?: TransportProtocol;
  mode?: StreamingMode;
  targetCodec?: string;
  compressionLevel?: string;
  preTranscode?: boolean;
  preCompress?: boolean;
  bufferSize?: number;
  inputCodec?: string;
  sampleRate?: number;
  channels?: number;
  bitrate?: number;
  outputFormat?: 'wav' | 'mp3';
  saveOutputPath?: string;
  fileId?: string;
}

export interface StreamMetadata {
  streamId: string;
  filePath: string;
  duration: number;
  codec: string;
  sampleRate: number;
  channels: number;
  bitrate?: number;
  mimeType: string;
}


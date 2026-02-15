export type TransportProtocol = 'http' | 'websocket' | 'rtp' | 'webrtc';
export type PlaybackState = 'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'seeking' | 'ended' | 'error';
export type StreamingMode = 'file-based' | 'live';

export interface StreamingSession {
  sessionId: string;
  filePath: string;
  state: PlaybackState;
  currentTime: number;
  transport: TransportProtocol;
  mode: StreamingMode;
  chunkDuration?: number;
  inputCodec?: string;
  sampleRate?: number;
  channels?: number;
  bitrate?: number;
  outputFormat?: 'wav' | 'mp3';
  targetCodec?: string;
  compressionLevel?: string;
  preTranscode?: boolean;
  preCompress?: boolean;
  bufferSize?: number;
  saveOutputPath?: string;
  fileId?: string;
  startedAt: number;
  lastActivity: number;
}

export interface StreamingPreparationOptions {
  transport?: TransportProtocol;
  mode?: StreamingMode;
  targetCodec?: string;
  compressionLevel?: string;
  preTranscode?: boolean;
  preCompress?: boolean;
  bufferSize?: number;
  chunkDuration?: number;
  inputCodec?: string;
  sampleRate?: number;
  channels?: number;
  bitrate?: number;
  outputFormat?: 'wav' | 'mp3';
  saveOutputPath?: string;
  fileId?: string;
}

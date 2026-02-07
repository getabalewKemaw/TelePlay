
import type {
  StreamingSession,
  PreparedChunk,
  PlaybackControlRequest,
  PlaybackControlResponse,
  StreamingPreparationOptions,
  StreamMetadata
} from '../../types/streaming/StreamingTypes.js';
export interface IStreamingPreparationService {
  createSession(filePath: string, options?: StreamingPreparationOptions): Promise<StreamingSession>;
  prepareChunks(sessionId: string, chunkIndices?: number[]): Promise<PreparedChunk[]>;
  handlePlaybackControl(sessionId: string, request: PlaybackControlRequest): Promise<PlaybackControlResponse>;
  getStreamMetadata(sessionId: string): Promise<StreamMetadata>;
  getSession(sessionId: string): Promise<StreamingSession | undefined>;
  cleanupSession(sessionId: string): Promise<void>;
}

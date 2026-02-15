
import type {
  StreamingSession,
  StreamingPreparationOptions
} from '../../types/streaming/StreamingTypes.js';
export interface IStreamingPreparationService {
  createSession(filePath: string, options?: StreamingPreparationOptions): Promise<StreamingSession>;
  getSession(sessionId: string): Promise<StreamingSession | undefined>;
}

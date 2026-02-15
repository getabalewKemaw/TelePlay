
import type {
    TransportProtocol,
    StreamingMode,
    StreamingSession
} from '../types/streaming/StreamingTypes.js';


export interface CreateSessionRequestDto {
    filePath: string;
    options?: {
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
    };
}

export interface SessionResponse {
    sessionId: string;
    session: StreamingSession;
}

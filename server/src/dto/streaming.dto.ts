
import type {
    TransportProtocol,
    StreamingMode,
    PlaybackAction,
    StreamingSession,
    PreparedChunk,
    StreamMetadata
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
        inputCodec?: string;
        sampleRate?: number;
        channels?: number;
        bitrate?: number;
        outputFormat?: 'wav' | 'mp3';
        saveOutputPath?: string;
        fileId?: string;
    };
}

export interface PlaybackControlRequestDto {
    action: PlaybackAction;
    targetTime?: number;
    amount?: number;
}

export interface PrepareItemsRequestDto {
    indices?: number[];
}

/**
 * RESPONSES
 */

export interface SessionResponse {
    sessionId: string;
    session: StreamingSession;
}

export interface PlaybackResponse {
    currentTime: number;
    state: string;
    preparedChunks: PreparedChunk[];
}

export interface StreamMetadataResponse {
    metadata: StreamMetadata;
}

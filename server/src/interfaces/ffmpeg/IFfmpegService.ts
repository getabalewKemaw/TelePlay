/**
 * FFmpeg Service Interface
 * Full interface for FFmpeg service operations
 */

import type {
    DecodeParams,
    EncodeParams,
    TranscodeParams,
    FFmpegExecutionResult
} from '../../types/ffmpeg/FFmpegTypes.js';

/**
 * Full interface for FFmpeg service
 * Provides decode, encode, and transcode operations
 */
export interface IFfmpegService {
    /**
     * Decode audio from compressed/telecom format to PCM
     */
    decode(params: DecodeParams): Promise<FFmpegExecutionResult>;

    /**
     * Encode audio with specified encoding parameters
     */
    encode(params: EncodeParams): Promise<FFmpegExecutionResult>;

    /**
     * Transcode audio from one codec/format to another
     */
    transcode(params: TranscodeParams): Promise<FFmpegExecutionResult>;

    /**
     * Check if FFmpeg is available
     */
    isAvailable?(): Promise<boolean>;
}

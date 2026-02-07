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
export interface IFfmpegService {
    decode(params: DecodeParams): Promise<FFmpegExecutionResult>;
    encode(params: EncodeParams): Promise<FFmpegExecutionResult>;
    transcode(params: TranscodeParams): Promise<FFmpegExecutionResult>;

}

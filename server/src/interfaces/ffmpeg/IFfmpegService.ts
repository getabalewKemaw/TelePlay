/**
 * FFmpeg Service Interface
 * Full interface for FFmpeg service operations
 */

import type {
    DecodeParams,
    FFmpegExecutionResult
} from '../../types/ffmpeg/FFmpegTypes.js';
export interface IFfmpegService {
    decode(params: DecodeParams): Promise<FFmpegExecutionResult>;
}

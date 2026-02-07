/**
 * FFmpeg Executor Interface
 * Low-level interface for executing FFmpeg commands
 */
import type { FFmpegCommandOptions, FFmpegExecutionResult } from '../../types/ffmpeg/FFmpegTypes.js';
export interface IFfmpegExecutor {
    execute(options: FFmpegCommandOptions, timeout?: number): Promise<FFmpegExecutionResult>;
}

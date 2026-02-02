/**
 * FFmpeg Executor Interface
 * Low-level interface for executing FFmpeg commands
 */

import type { FFmpegCommandOptions, FFmpegExecutionResult } from '../../types/ffmpeg/FFmpegTypes.js';

/**
 * Interface for FFmpeg command execution
 * Provides low-level command execution with timeout support
 */
export interface IFfmpegExecutor {
    /**
     * Execute FFmpeg command with given options
     * @param options - Command options
     * @param timeout - Optional timeout in milliseconds
     * @returns Promise resolving to execution result
     */
    execute(options: FFmpegCommandOptions, timeout?: number): Promise<FFmpegExecutionResult>;
}

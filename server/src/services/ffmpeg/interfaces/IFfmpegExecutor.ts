/**
 * FFmpeg Executor Interface
 * Dependency inversion interface for FFmpeg execution
 * Allows for testing and alternative implementations
 */

import type { FFmpegExecutionResult, FFmpegCommandOptions } from '../types/FFmpegTypes.js';

/**
 * Interface for FFmpeg command execution
 * This abstraction allows for:
 * - Easy testing with mock implementations
 * - Alternative execution strategies (e.g., Docker, remote execution)
 * - Future microservice extraction
 */
export interface IFfmpegExecutor {
  /**
   * Execute FFmpeg command with given options
   * @param options - FFmpeg command options
   * @param timeout - Optional timeout in milliseconds
   * @returns Promise resolving to execution result
   */
  execute(options: FFmpegCommandOptions, timeout?: number): Promise<FFmpegExecutionResult>;

  /**
   * Check if FFmpeg is available in the system
   * @returns Promise resolving to true if FFmpeg is available
   */
  isAvailable(): Promise<boolean>;

  /**
   * Get FFmpeg version information
   * @returns Promise resolving to version string
   */
  getVersion(): Promise<string>;
}

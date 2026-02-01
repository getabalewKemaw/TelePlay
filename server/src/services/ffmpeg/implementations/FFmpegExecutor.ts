/**
 * FFmpeg Executor Implementation
 * Concrete implementation of IFfmpegExecutor using child_process
 */

import { spawn } from 'child_process';
import type { IFfmpegExecutor } from '../interfaces/IFfmpegExecutor.js';
import type { FFmpegCommandOptions, FFmpegExecutionResult } from '../types/FFmpegTypes.js';
import { FFmpegExecutionError, FFmpegTimeoutError } from '../errors/FFmpegErrors.js';

/**
 * Default FFmpeg executable name
 */
const FFMPEG_EXECUTABLE = 'ffmpeg';

/**
 * Default timeout for FFmpeg operations (30 minutes)
 */
const DEFAULT_TIMEOUT = 30 * 60 * 1000;

/**
 * FFmpeg Executor implementation
 * Handles actual FFmpeg process execution with proper error handling and metrics
 */
export class FFmpegExecutor implements IFfmpegExecutor {
  private readonly executable: string;
  private readonly defaultTimeout: number;

  constructor(executable: string = FFMPEG_EXECUTABLE, defaultTimeout: number = DEFAULT_TIMEOUT) {
    this.executable = executable;
    this.defaultTimeout = defaultTimeout;
  }

  /**
   * Execute FFmpeg command
   */
  async execute(
    options: FFmpegCommandOptions,
    timeout: number = this.defaultTimeout
  ): Promise<FFmpegExecutionResult> {
    const startTime = Date.now();
    const args = this.buildCommandArgs(options);

    return new Promise<FFmpegExecutionResult>((resolve, reject) => {
      const process = spawn(this.executable, args, {
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';
      let timeoutId: NodeJS.Timeout | null = null;

      // Set up timeout
      if (timeout > 0) {
        timeoutId = setTimeout(() => {
          process.kill('SIGTERM');
          const executionTime = Date.now() - startTime;
          reject(
            new FFmpegTimeoutError(
              `FFmpeg execution timed out after ${timeout}ms`,
              timeout
            )
          );
        }, timeout);
      }

      // Capture stdout
      if (process.stdout) {
        process.stdout.on('data', (data: Buffer) => {
          stdout += data.toString();
        });
      }

      // Capture stderr
      if (process.stderr) {
        process.stderr.on('data', (data: Buffer) => {
          stderr += data.toString();
        });
      }

      // Handle process completion
      process.on('close', (exitCode) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        const executionTime = Date.now() - startTime;
        const result: FFmpegExecutionResult = {
          success: exitCode === 0,
          executionTime,
          exitCode: exitCode ?? -1,
          stderr: stderr.trim(),
          stdout: stdout.trim(),
          outputPath: options.output
        };

        if (exitCode === 0) {
          resolve(result);
        } else {
          reject(
            new FFmpegExecutionError(
              `FFmpeg execution failed with exit code ${exitCode}`,
              exitCode ?? -1,
              stderr.trim(),
              executionTime
            )
          );
        }
      });

      // Handle process errors
      process.on('error', (error: Error) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        const executionTime = Date.now() - startTime;
        reject(
          new FFmpegExecutionError(
            `Failed to spawn FFmpeg process: ${error.message}`,
            -1,
            error.message,
            executionTime
          )
        );
      });
    });
  }

  /**
   * Check if FFmpeg is available
   */
  async isAvailable(): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const startTime = Date.now();
      const process = spawn(this.executable, ['-version'], {
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let timeoutId: NodeJS.Timeout | null = setTimeout(() => {
        process.kill('SIGTERM');
        resolve(false);
      }, 5000);

      process.on('close', (exitCode) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        resolve(exitCode === 0);
      });

      process.on('error', () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        resolve(false);
      });
    });
  }

  /**
   * Get FFmpeg version
   */
  async getVersion(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const startTime = Date.now();
      const process = spawn(this.executable, ['-version'], {
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';
      let timeoutId: NodeJS.Timeout | null = setTimeout(() => {
        process.kill('SIGTERM');
        const executionTime = Date.now() - startTime;
        reject(
          new FFmpegTimeoutError(
            `FFmpeg version check timed out after 5000ms`,
            5000
          )
        );
      }, 5000);

      if (process.stdout) {
        process.stdout.on('data', (data: Buffer) => {
          stdout += data.toString();
        });
      }

      if (process.stderr) {
        process.stderr.on('data', (data: Buffer) => {
          stderr += data.toString();
        });
      }

      process.on('close', (exitCode) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        if (exitCode === 0) {
          const lines = stdout.split('\n');
          resolve(lines[0] || 'Unknown version');
        } else {
          const executionTime = Date.now() - startTime;
          reject(
            new FFmpegExecutionError(
              `Failed to get FFmpeg version: exit code ${exitCode}`,
              exitCode ?? -1,
              stderr.trim(),
              executionTime
            )
          );
        }
      });

      process.on('error', (error: Error) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        const executionTime = Date.now() - startTime;
        reject(
          new FFmpegExecutionError(
            `Failed to spawn FFmpeg process: ${error.message}`,
            -1,
            error.message,
            executionTime
          )
        );
      });
    });
  }

  /**
   * Build FFmpeg command arguments from options
   */
  private buildCommandArgs(options: FFmpegCommandOptions): string[] {
    const args: string[] = [];

    // Additional arguments (input format/codec options) must come BEFORE -i
    if (options.additionalArgs) {
      args.push(...options.additionalArgs);
    }

    // Input file
    args.push('-i', options.input);

    // Output codec (for encoding, not decoding)
    if (options.codec) {
      args.push('-acodec', this.mapCodecToFFmpeg(options.codec));
    }

    // Sample rate (for output)
    if (options.sampleRate) {
      args.push('-ar', options.sampleRate.toString());
    }

    // Channels (for output)
    if (options.channels) {
      args.push('-ac', options.channels.toString());
    }

    // Bitrate (for output encoding)
    if (options.bitrate) {
      args.push('-b:a', `${options.bitrate}k`);
    }

    // Output format
    if (options.format) {
      args.push('-f', options.format);
    }

    // Overwrite output file if exists
    args.push('-y');

    // Output file (must be last)
    args.push(options.output);

    return args;
  }

  /**
   * Map internal codec names to FFmpeg codec names
   */
  private mapCodecToFFmpeg(codec: string): string {
    const codecMap: Record<string, string> = {
      g711: 'pcm_mulaw', // G.711 μ-law
      g726: 'g726',
      g728: 'g728',
      pcm_s16le: 'pcm_s16le',
      pcm_s24le: 'pcm_s24le',
      aac: 'aac',
      mp3: 'libmp3lame',
      opus: 'libopus'
    };

    return codecMap[codec] || codec;
  }
}

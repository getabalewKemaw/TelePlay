import { spawn } from 'child_process';
import type { IFfmpegExecutor } from '../../../interfaces/ffmpeg/IFfmpegExecutor.js';
import type { FFmpegCommandOptions, FFmpegExecutionResult } from '../../../types/ffmpeg/FFmpegTypes.js';
import { FFmpegExecutionError, FFmpegTimeoutError } from '../../../errors/ffmpeg/FFmpegErrors.js';
import { FFMPEG_EXECUTABLE, DEFAULT_TIMEOUT } from '../../../constants/ffmpeg/index.js';
import { mapCodecToFFmpeg } from '../../../utils/ffmpeg/codecMap.js';
export class FFmpegExecutor implements IFfmpegExecutor {
  private readonly executable: string;
  private readonly defaultTimeout: number;
  private readonly maxBufferBytes = 256 * 1024;
  constructor(executable: string = FFMPEG_EXECUTABLE, defaultTimeout: number = DEFAULT_TIMEOUT) {
    this.executable = executable;
    this.defaultTimeout = defaultTimeout;
  }
  async execute(
    options: FFmpegCommandOptions,
    timeout: number = this.defaultTimeout
  ): Promise<FFmpegExecutionResult> {
    const startTime = Date.now();
    const args = this.buildCommandArgs(options);
    return new Promise<FFmpegExecutionResult>((resolve, reject) => {
      const process = spawn(this.executable, args, {
        stdio: ['ignore', 'pipe', 'pipe']
        // ignore stdin, pipe stdout and stderr
      });
      let stdout = '';
      let stderr = '';
      let timeoutId: NodeJS.Timeout | null = null;
      let settled = false;
      const appendBuffer = (current: string, chunk: Buffer): string => {
        if (this.maxBufferBytes <= 0) return current;
        const next = current + chunk.toString();
        if (Buffer.byteLength(next) <= this.maxBufferBytes) return next;
        return next.slice(next.length - this.maxBufferBytes);
      };
      const finalize = (fn: () => void) => {
        if (settled) return;
        settled = true;
        if (timeoutId) clearTimeout(timeoutId);
        fn();
      };
      // Set up timeout
      if (timeout > 0) {
        timeoutId = setTimeout(() => {
          process.kill('SIGTERM'); // stop ffmpeg running forever
          finalize(() => {
            const executionTime = Date.now() - startTime;
            reject(
              new FFmpegTimeoutError(
                `FFmpeg execution timed out after ${timeout}ms`,
                timeout
              )
            );
          });
        }, timeout);
      }
      // Capture stdout
      if (process.stdout) {
        process.stdout.on('data', (data: Buffer) => {
          stdout = appendBuffer(stdout, data);
        });
      }
      // capture stderr
      if (process.stderr) {
        process.stderr.on('data', (data: Buffer) => {
          stderr = appendBuffer(stderr, data);
        });
      }
      // handle process completion
      process.on('close', (exitCode) => {
        finalize(() => {
          const executionTime = Date.now() - startTime;
          const result: FFmpegExecutionResult = {
            success: exitCode === 0,
            executionTime,
            exitCode: exitCode ?? -1,
            stderr: stderr.trim(),
            stdout: stdout.trim(),
            outputPath: options.output
          };
          console.log(` here us the resulsts: ${JSON.stringify(result)}`);
          console.log(`FFmpeg command executed in ${executionTime}ms with exit code ${exitCode}`);

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
      });
      // handle  process errors
      process.on('error', (error: Error) => {
        finalize(() => {
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
    });
  }
  private buildCommandArgs(options: FFmpegCommandOptions): string[] {
    const args: string[] = [];

    if (options.startTime !== undefined) {
      args.push('-ss', options.startTime.toString());
    }
    if (options.additionalArgs) {
      args.push(...options.additionalArgs);
    }
    args.push('-i', options.input);

    // Duration should be specified after input
    if (options.duration !== undefined) {
      args.push('-t', options.duration.toString());
    }

    if (options.codec) {
      args.push('-acodec', mapCodecToFFmpeg(options.codec));
    }
    if (options.sampleRate) {
      args.push('-ar', options.sampleRate.toString());
    }
    if (options.channels) {
      args.push('-ac', options.channels.toString());
    }
    // Bitrate (for output encoding)
    if (options.bitrate) {
      args.push('-b:a', `${options.bitrate}k`);
    }
    if (options.format) {
      args.push('-f', options.format);
    }
    args.push('-y');// overwrite output files without asking
    args.push(options.output);
    return args;
  }
}

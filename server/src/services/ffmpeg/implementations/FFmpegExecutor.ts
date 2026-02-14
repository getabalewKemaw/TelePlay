import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import type { IFfmpegExecutor } from '../../../interfaces/ffmpeg/IFfmpegExecutor.js';
import type { FFmpegCommandOptions, FFmpegExecutionResult, FFmpegProgressUpdate, FFmpegStdioMode } from '../../../types/ffmpeg/FFmpegTypes.js';
import { FFmpegExecutionError, FFmpegTimeoutError } from '../../../errors/ffmpeg/FFmpegErrors.js';
import { FFMPEG_EXECUTABLE, DEFAULT_TIMEOUT } from '../../../constants/ffmpeg/index.js';
import { mapCodecToFFmpeg } from '../../../utils/ffmpeg/codecMap.js';
export class FFmpegExecutor implements IFfmpegExecutor {
  private readonly executable: string;
  private readonly defaultTimeout: number;
  private readonly defaultMaxBufferBytes = 256 * 1024;
  private readonly defaultTimeoutGraceMs = 2000;
  constructor(executable: string = FFMPEG_EXECUTABLE, defaultTimeout: number = DEFAULT_TIMEOUT) {
    this.executable = executable;
    this.defaultTimeout = defaultTimeout;
  }
  async execute(
    options: FFmpegCommandOptions,
    timeout: number = this.defaultTimeout
  ): Promise<FFmpegExecutionResult> {
    const startTime = Date.now();
    const normalizedOptions = this.normalizeOptions(options);
    const args = this.buildCommandArgs(normalizedOptions);
    const maxBufferBytes = normalizedOptions.maxBufferBytes ?? this.defaultMaxBufferBytes;
    const timeoutGraceMs = normalizedOptions.timeoutGraceMs ?? this.defaultTimeoutGraceMs;
    const logger = normalizedOptions.logger;
    return new Promise<FFmpegExecutionResult>((resolve, reject) => {
      const stdio = this.resolveStdio(normalizedOptions.stdin, normalizedOptions.stdout, normalizedOptions.stderr);
      const process = spawn(this.executable, args, { stdio });
      let stdout = '';
      let stderr = '';
      let timeoutId: NodeJS.Timeout | null = null;
      let killTimerId: NodeJS.Timeout | null = null;
      let settled = false;
      let progressBuffer = '';
      let progressState: FFmpegProgressUpdate = {};
      const appendBuffer = (current: string, chunk: Buffer): string => {
        if (maxBufferBytes <= 0) return current;
        const next = current + chunk.toString();
        if (Buffer.byteLength(next) <= maxBufferBytes) return next;
        return next.slice(next.length - maxBufferBytes);
      };
      const finalize = (fn: () => void) => {
        if (settled) return;
        settled = true;
        if (timeoutId) clearTimeout(timeoutId);
        if (killTimerId) clearTimeout(killTimerId);
        fn();
      };

      if (timeout > 0) {
        timeoutId = setTimeout(() => {
          process.kill('SIGTERM'); // stop ffmpeg running forever
          if (timeoutGraceMs > 0) {
            killTimerId = setTimeout(() => {
              process.kill('SIGKILL');
            }, timeoutGraceMs);
          }
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

      if (normalizedOptions.stdin && typeof normalizedOptions.stdin !== 'string' && process.stdin) {
        normalizedOptions.stdin.pipe(process.stdin);
      }

      if (process.stdout && stdio[1] === 'pipe') {
        process.stdout.on('data', (data: Buffer) => {
          stdout = appendBuffer(stdout, data);
        });
      }

      if (process.stderr && stdio[2] === 'pipe') {
        process.stderr.on('data', (data: Buffer) => {
          stderr = appendBuffer(stderr, data);
          if (normalizedOptions.onProgress) {
            progressBuffer += data.toString();
            let index = progressBuffer.indexOf('\n');
            while (index >= 0) {
              const line = progressBuffer.slice(0, index).trim();
              progressBuffer = progressBuffer.slice(index + 1);
              if (line) {
                const parts = line.split('=');
                if (parts.length >= 2) {
                  const key = parts[0];
                  const value = parts.slice(1).join('=');
                  const numericValue = Number(value);
                  progressState[key!] = Number.isNaN(numericValue) ? value : numericValue;
                  if (key === 'progress') {
                    normalizedOptions.onProgress({ ...progressState });
                    progressState = {};
                  }
                }
              }
              index = progressBuffer.indexOf('\n');
            }
          }
        });
      }

      process.on('close', (exitCode) => {
        finalize(() => {
          const executionTime = Date.now() - startTime;
          const result: FFmpegExecutionResult = {
            success: exitCode === 0,
            executionTime,
            exitCode: exitCode ?? -1,
            stderr: stderr.trim(),
            stdout: stdout.trim(),
            outputPath: normalizedOptions.output
          };
          logger?.info?.(`FFmpeg command executed in ${executionTime}ms with exit code ${exitCode}`);

          if (exitCode === 0) {
            if (normalizedOptions.validateOutput) {
              this.validateOutput(normalizedOptions, result)
                .then(() => resolve(result))
                .catch((error) => reject(error));
            } else {
              resolve(result);
            }
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
    const preInputArgs = [
      ...(options.preInputArgs ?? []),
      ...(options.additionalArgs ?? [])
    ];

    if (preInputArgs.length > 0) {
      args.push(...preInputArgs);
    }
    if (options.startTime !== undefined) {
      args.push('-ss', options.startTime.toString());
    }
    args.push('-i', options.input);
    if (options.postInputArgs && options.postInputArgs.length > 0) {
      args.push(...options.postInputArgs);
    }

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
    if (options.outputArgs && options.outputArgs.length > 0) {
      args.push(...options.outputArgs);
    }
    args.push('-y');// overwrite output files without asking
    args.push(options.output);
    return args;
  }

  private normalizeOptions(options: FFmpegCommandOptions): FFmpegCommandOptions {
    const preInputArgs = [
      ...(options.preInputArgs ?? []),
      ...(options.additionalArgs ?? [])
    ];

    if (options.onProgress && !preInputArgs.includes('-progress')) {
      preInputArgs.push('-progress', 'pipe:2', '-nostats');
    }

    return {
      ...options,
      preInputArgs,
      additionalArgs: undefined,
      stderr: options.onProgress ? 'pipe' : options.stderr,
      stdin: options.stdin ?? (options.input === 'pipe:0' ? 'pipe' : undefined)
    };
  }

  private resolveStdio(
    stdin: FFmpegCommandOptions['stdin'],
    stdout: FFmpegCommandOptions['stdout'],
    stderr: FFmpegCommandOptions['stderr']
  ): [FFmpegStdioMode | 'pipe', FFmpegStdioMode, FFmpegStdioMode] {
    const stdinMode: FFmpegStdioMode | 'pipe' =
      stdin && typeof stdin !== 'string' ? 'pipe' : (stdin ?? 'ignore');
    const stdoutMode: FFmpegStdioMode = stdout ?? 'pipe';
    const stderrMode: FFmpegStdioMode = stderr ?? 'pipe';
    return [stdinMode, stdoutMode, stderrMode];
  }

  private async validateOutput(
    options: FFmpegCommandOptions,
    result: FFmpegExecutionResult
  ): Promise<void> {
    const outputPath = options.output;
    if (
      outputPath === '-' ||
      outputPath.toUpperCase() === 'NUL' ||
      outputPath.startsWith('pipe:')
    ) {
      return;
    }
    const minBytes = options.minOutputBytes ?? 1;
    try {
      const stats = await fs.stat(outputPath);
      if (stats.size < minBytes) {
        throw new FFmpegExecutionError(
          `FFmpeg output file is smaller than ${minBytes} bytes`,
          result.exitCode,
          result.stderr,
          result.executionTime
        );
      }
    } catch (error: any) {
      if (error?.code === 'ENOENT') {
        throw new FFmpegExecutionError(
          'FFmpeg output file was not created',
          result.exitCode,
          result.stderr,
          result.executionTime
        );
      }
      throw error;
    }
  }
}

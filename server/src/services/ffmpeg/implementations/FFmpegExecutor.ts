import { spawn } from 'child_process';
import type { IFfmpegExecutor } from '../../../interfaces/ffmpeg/IFfmpegExecutor.js';
import type { FFmpegCommandOptions, FFmpegExecutionResult } from '../../../types/ffmpeg/FFmpegTypes.js';
import { FFmpegExecutionError, FFmpegTimeoutError } from '../../../errors/ffmpeg/FFmpegErrors.js';
import { FFMPEG_EXECUTABLE, DEFAULT_TIMEOUT } from '../../../constants/ffmpeg/index.js';
export class FFmpegExecutor implements IFfmpegExecutor {
  private readonly executable: string;
  private readonly defaultTimeout: number;
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
      // Set up timeout
      if (timeout > 0) {
        timeoutId = setTimeout(() => {
          process.kill('SIGTERM');//Kills process after timeout with SIGTERM signal,eg stop ffmpeg running forever
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
      // capture stderr
      if (process.stderr) {
        process.stderr.on('data', (data: Buffer) => {
          stderr += data.toString();
        });
      }
      // handle process completion
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
      // handle  process errors
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
      args.push('-acodec', this.mapCodecToFFmpeg(options.codec));
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

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import type { IFfmpegExecutor } from '../../../interfaces/ffmpeg/IFfmpegExecutor.js';
import type { FFmpegCommandOptions, FFmpegExecutionResult, FFmpegProgressUpdate } from '../../../types/ffmpeg/FFmpegTypes.js';
import { createFFmpegExecutionError, createFFmpegTimeoutError } from '../../../errors/ffmpeg/FFmpegErrors.js';
import { FFMPEG_EXECUTABLE, DEFAULT_TIMEOUT } from '../../../constants/ffmpeg/index.js';
import {
  buildCommandArgs,
  normalizeOptions,
  resolveStdio,
  shouldPipeStdin,
  updateProgressFromChunk,
  validateOutputFile
} from '../../../utils/ffmpeg/ffmpegExecutorUtils.js';
export const createFFmpegExecutor = (
  executable: string = FFMPEG_EXECUTABLE,
  defaultTimeout: number = DEFAULT_TIMEOUT
): IFfmpegExecutor => {
  const defaultMaxBufferBytes = 256 * 1024;
  const defaultTimeoutGraceMs = 2000;

  const validateOutput = async (
    options: FFmpegCommandOptions,
    result: FFmpegExecutionResult
  ): Promise<void> => {
    await validateOutputFile(
      options,
      result,
      (path) => fs.stat(path),
      (message) => createFFmpegExecutionError(
        message,
        result.exitCode,
        result.stderr,
        result.executionTime
      )
    );
  };

  const execute = async (
    options: FFmpegCommandOptions,
    timeout: number = defaultTimeout
  ): Promise<FFmpegExecutionResult> => {
    const startTime = Date.now();
    const normalizedOptions = normalizeOptions(options);
    const args = buildCommandArgs(normalizedOptions);
    const maxBufferBytes = normalizedOptions.maxBufferBytes ?? defaultMaxBufferBytes;
    const timeoutGraceMs = normalizedOptions.timeoutGraceMs ?? defaultTimeoutGraceMs;
    const logger = normalizedOptions.logger;
    return new Promise<FFmpegExecutionResult>((resolve, reject) => {
      const stdio = resolveStdio(normalizedOptions.stdin, normalizedOptions.stdout, normalizedOptions.stderr);
      const process = spawn(executable, args, { stdio });
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
          process.kill('SIGTERM');
          if (timeoutGraceMs > 0) {
            killTimerId = setTimeout(() => {
              process.kill('SIGKILL');
            }, timeoutGraceMs);
          }
          finalize(() => {
            const executionTime = Date.now() - startTime;
            reject(
              createFFmpegTimeoutError(
                `FFmpeg execution timed out after ${timeout}ms`,
                timeout
              )
            );
          });
        }, timeout);
      }
      if (shouldPipeStdin(normalizedOptions) && process.stdin) {
        const inputStream = normalizedOptions.stdin;
        if (inputStream && typeof inputStream !== 'string') {
          inputStream.pipe(process.stdin);
        }
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
            const updated = updateProgressFromChunk(
              progressBuffer,
              progressState,
              data,
              normalizedOptions.onProgress
            );
            progressBuffer = updated.buffer;
            progressState = updated.state;
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
              validateOutput(normalizedOptions, result)
                .then(() => resolve(result))
                .catch((error) => reject(error));
            } else {
              resolve(result);
            }
          } else {
            reject(
              createFFmpegExecutionError(
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
            createFFmpegExecutionError(
              `Failed to spawn FFmpeg process: ${error.message}`,
              -1,
              error.message,
              executionTime
            )
          );
        });
      });
    });
  };

  return {
    execute
  };
};

export type FFmpegExecutor = ReturnType<typeof createFFmpegExecutor>;

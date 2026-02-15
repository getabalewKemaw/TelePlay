import type { FFmpegCommandOptions, FFmpegExecutionResult, FFmpegProgressUpdate, FFmpegStdioMode } from '../../types/ffmpeg/FFmpegTypes.js';
import { mapCodecToFFmpeg } from './codecMap.js';
type NormalizedFFmpegOptions = FFmpegCommandOptions & {
  preInputArgs: string[];
};
export function normalizeOptions(options: FFmpegCommandOptions): NormalizedFFmpegOptions {
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
export function resolveStdio(
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
export function buildCommandArgs(options: FFmpegCommandOptions): string[] {
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
  if (options.bitrate) {
    args.push('-b:a', `${options.bitrate}k`);
  }
  if (options.format) {
    args.push('-f', options.format);
  }
  if (options.outputArgs && options.outputArgs.length > 0) {
    args.push(...options.outputArgs);
  }
  args.push('-y');
  args.push(options.output);
  return args;
}

export function updateProgressFromChunk(
  progressBuffer: string,
  progressState: FFmpegProgressUpdate,
  chunk: Buffer,
  onProgress?: (update: FFmpegProgressUpdate) => void
): { buffer: string; state: FFmpegProgressUpdate } {
  if (!onProgress) {
    return { buffer: progressBuffer, state: progressState };
  }
  let buffer = progressBuffer + chunk.toString();
  let state = progressState;
  let index = buffer.indexOf('\n');
  while (index >= 0) {
    const line = buffer.slice(0, index).trim();
    buffer = buffer.slice(index + 1);
    if (line) {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0];
        const value = parts.slice(1).join('=');
        const numericValue = Number(value);
        state = {
          ...state,
          [key!]: Number.isNaN(numericValue) ? value : numericValue
        };
        if (key === 'progress') {
          onProgress(state);
          state = {};
        }
      }
    }
    index = buffer.indexOf('\n');
  }
  return { buffer, state };
}

export function shouldPipeStdin(options: FFmpegCommandOptions): boolean {
  return Boolean(options.stdin && typeof options.stdin !== 'string');
}
export async function validateOutputFile(
  options: FFmpegCommandOptions,
  result: FFmpegExecutionResult,
  stat: (path: string) => Promise<{ size: number }>,
  buildError: (message: string) => Error
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
    const stats = await stat(outputPath);
    if (stats.size < minBytes) {
      throw buildError(`FFmpeg output file is smaller than ${minBytes} bytes`);
    }
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      throw buildError('FFmpeg output file was not created');
    }
    throw error;
  }
}

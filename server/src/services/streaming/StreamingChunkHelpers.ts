import type { Response } from 'express';
import type { ChunkMetadata } from '../../types/chunking/ChunkingTypes.js';
import type { StreamingSession } from '../../types/streaming/StreamingTypes.js';
import {
  appendOutputCodecArgs,
  resolveInputCodecArgs,
  type StreamingOutputFormat
} from '../../utils/streaming/streamingFfmpegUtils.js';

export const getSessionChunkDuration = (session: StreamingSession): number => (
  session.chunkDuration ?? 10
);

export const buildChunkStreamArgs = (
  session: StreamingSession,
  filePath: string,
  chunk: ChunkMetadata,
  outputFormat: StreamingOutputFormat
): string[] => {
  const args: string[] = [
    ...resolveInputCodecArgs(session),
    '-i', filePath,
    '-ss', chunk.startTime.toString(),
    '-t', chunk.duration.toString(),
    '-map', '0:a:0',
    '-vn'
  ];
  appendOutputCodecArgs(args, outputFormat, session);
  args.push('-f', outputFormat, 'pipe:1');
  return args;
};

export const buildChunkPeaksArgs = (session: StreamingSession, filePath: string, chunk: ChunkMetadata): string[] => {
  return [
    ...resolveInputCodecArgs(session),
    '-i', filePath,
    '-ss', chunk.startTime.toString(),
    '-t', chunk.duration.toString(),
    '-map', '0:a:0',
    '-vn',
    '-ac', '1',
    '-ar', '8000',
    '-f', 's16le',
    'pipe:1'
  ];
};

export const buildLiveStreamArgs = (
  session: StreamingSession,
  filePath: string,
  outputFormat: StreamingOutputFormat
): string[] => {
  const args: string[] = [...resolveInputCodecArgs(session), '-i', filePath, '-map', '0:a:0', '-vn'];
  appendOutputCodecArgs(args, outputFormat, session);
  return args;
};

export const applyChunkStreamHeaders = (res: Response, mimeType: string): void => {
  res.setHeader('Content-Type', mimeType);
  res.setHeader('Transfer-Encoding', 'chunked');
  res.removeHeader('Accept-Ranges');
};

export const calculatePeaks = (buffer: Buffer, bins: number): number[] => {
  const sampleCount = Math.floor(buffer.length / 2);
  const samplesPerBin = Math.max(1, Math.floor(sampleCount / bins));
  const peaks: number[] = new Array(bins).fill(0);

  for (let i = 0; i < bins; i++) {
    const start = i * samplesPerBin;
    const end = Math.min(start + samplesPerBin, sampleCount);
    let max = 0;
    for (let s = start; s < end; s++) {
      const sample = buffer.readInt16LE(s * 2);
      const abs = Math.abs(sample);
      if (abs > max) max = abs;
    }
    peaks[i] = max / 32768;
  }
  return peaks;
};

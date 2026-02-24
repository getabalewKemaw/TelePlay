import type { Response } from 'express';
import type { ChunkMetadata } from '../../types/chunking/ChunkingTypes.js';
import type { StreamingSession } from '../../types/streaming/StreamingTypes.js';
import path from 'path';
import {
  attachResponseCleanup,
  getStreamingMimeType,
  spawnFfmpeg,
  type StreamingOutputFormat
} from '../../utils/streaming/streamingFfmpegUtils.js';
import {
  applyChunkStreamHeaders,
  buildChunkPeaksArgs,
  buildChunkStreamArgs,
  calculatePeaks,
  getSessionChunkDuration
} from './StreamingChunkHelpers.js';
import { chunkingService } from '../chunking/ChunkingService.js';

const chunking = chunkingService;

export const resolveSessionChunk = async (session: StreamingSession, indexRaw: string): Promise<ChunkMetadata | null> => {
  const chunkDuration = getSessionChunkDuration(session);
  const chunks = await chunking.getAllChunks(session.filePath, { chunkDuration });
  const idx = parseInt(indexRaw, 10);
  return Number.isFinite(idx) ? (chunks[idx] ?? null) : null;
};

export const getChunkPeaks = async (
  session: StreamingSession,
  chunk: ChunkMetadata,
  bins: number
): Promise<number[]> => {
  const filePath = path.resolve(session.filePath);
  const args = buildChunkPeaksArgs(session, filePath, chunk);

  return await new Promise<number[]>((resolve, reject) => {
    const ffmpeg = spawnFfmpeg(args);
    const chunksBuf: Buffer[] = [];
    let stderr = '';

    if (ffmpeg.stdout) {
      ffmpeg.stdout.on('data', (data: Buffer) => chunksBuf.push(data));
    }
    if (ffmpeg.stderr) {
      ffmpeg.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });
    }

    ffmpeg.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`FFmpeg failed: ${stderr}`));
        return;
      }
      resolve(calculatePeaks(Buffer.concat(chunksBuf), bins));
    });
    ffmpeg.on('error', reject);
  });
};

export const streamChunk = (
  session: StreamingSession,
  chunk: ChunkMetadata,
  requestedFormat: string | undefined,
  res: Response
): void => {
  const filePath = path.resolve(session.filePath);
  const outputFormat: StreamingOutputFormat =
    requestedFormat === 'mp3' || requestedFormat === 'wav'
      ? requestedFormat
      : (session.outputFormat || 'mp3');

  applyChunkStreamHeaders(res, getStreamingMimeType(outputFormat));
  const args = buildChunkStreamArgs(session, filePath, chunk, outputFormat);
  const ffmpeg = spawnFfmpeg(args);
  attachResponseCleanup(ffmpeg, res);

  if (ffmpeg.stdout) {
    ffmpeg.stdout.pipe(res);
  }
  if (ffmpeg.stderr) {
    ffmpeg.stderr.on('data', (data: Buffer) => {
      console.warn('FFmpeg chunk stream:', data.toString());
    });
  }
  ffmpeg.on('error', (error) => {
    console.error('FFmpeg chunk stream error:', error);
  });
};

export const streamingChunkOperations = {
  resolveSessionChunk,
  getChunkPeaks,
  streamChunk
};

export type StreamingChunkOperations = typeof streamingChunkOperations;

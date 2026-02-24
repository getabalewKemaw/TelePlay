import type { Response } from 'express';
import type { ChunkMetadata } from '../../types/chunking/ChunkingTypes.js';
import type { StreamingSession } from '../../types/streaming/StreamingTypes.js';
import fs from 'fs';
import path from 'path';
import {
  attachResponseCleanup,
  getStreamingMimeType,
  resolveLiveOutputArgs,
  spawnFfmpeg,
  type StreamingOutputFormat
} from '../../utils/streaming/streamingFfmpegUtils.js';
import {
  applyChunkStreamHeaders,
  buildChunkPeaksArgs,
  buildChunkStreamArgs,
  buildLiveStreamArgs,
  calculatePeaks,
  getSessionChunkDuration
} from './StreamingChunkHelpers.js';
import { chunkingService } from '../chunking/ChunkingService.js';
import { fileRepository } from '../../repositories/file/FileRepository.js';
const chunking = chunkingService;

const resolveSessionChunk = async (session: StreamingSession, indexRaw: string): Promise<ChunkMetadata | null> => {
  const chunkDuration = getSessionChunkDuration(session);
  const chunks = await chunking.getAllChunks(session.filePath, { chunkDuration });
  const idx = parseInt(indexRaw, 10);
  return Number.isFinite(idx) ? (chunks[idx] ?? null) : null;
};

const getChunkPeaks = async (session: StreamingSession, chunk: ChunkMetadata, bins: number): Promise<number[]> => {
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

const streamLive = (session: StreamingSession, res: Response): void => {
  const filePath = path.resolve(session.filePath);
  const outputFormat: StreamingOutputFormat = session.outputFormat || 'mp3';
  applyChunkStreamHeaders(res, getStreamingMimeType(outputFormat));

  const args: string[] = buildLiveStreamArgs(session, filePath, outputFormat);
  const liveOutput = resolveLiveOutputArgs(session, outputFormat);
  args.push(...liveOutput.args);

  const ffmpeg = spawnFfmpeg(args);
  attachResponseCleanup(ffmpeg, res);

  if (ffmpeg.stdout) {
    ffmpeg.stdout.pipe(res);
  }
  if (ffmpeg.stderr) {
    ffmpeg.stderr.on('data', (data: Buffer) => {
      console.warn('FFmpeg stream:', data.toString());
    });
  }

  ffmpeg.on('close', async (code) => {
    if (code === 0 && liveOutput.savePath && session.fileId) {
      try {
        await fileRepository.updateDecodedPathReady(
          session.fileId,
          path.resolve(liveOutput.savePath)
        );
      } catch (error) {
        console.warn('Failed to update decodedPath after live stream:', error);
      }
    }
  });
  ffmpeg.on('error', (error) => {
    console.error('FFmpeg stream error:', error);
  });
};

const streamFileBased = async (session: StreamingSession, range: string | undefined, res: Response): Promise<void> => {
  const filePath = path.resolve(session.filePath);
  const stat = await fs.promises.stat(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mimeType = ext === '.mp3' ? 'audio/mpeg' : ext === '.wav' ? 'audio/wav' : 'application/octet-stream';
  if (!range) {
    res.writeHead(200, {
      'Content-Length': stat.size,
      'Content-Type': mimeType,
      'Accept-Ranges': 'bytes'
    });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  const match = /^bytes=(\d+)-(\d*)$/.exec(range);
  if (!match) {
    res.status(416).set('Content-Range', `bytes */${stat.size}`).end();
    return;
  }

  const start = parseInt(match[1]!, 10);
  const end = match[2] ? Math.min(parseInt(match[2], 10), stat.size - 1) : stat.size - 1;

  if (start >= stat.size || end < start) {
    res.writeHead(200, {
      'Content-Length': stat.size,
      'Content-Type': mimeType,
      'Accept-Ranges': 'bytes'
    });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  res.writeHead(206, {
    'Content-Range': `bytes ${start}-${end}/${stat.size}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': end - start + 1,
    'Content-Type': mimeType
  });
  fs.createReadStream(filePath, { start, end }).pipe(res);
};

const streamChunk = (
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

export const streamingChunkService = {
  getSessionChunkDuration,
  resolveSessionChunk,
  getChunkPeaks,
  streamLive,
  streamFileBased,
  streamChunk
};


export type StreamingChunkService = typeof streamingChunkService;

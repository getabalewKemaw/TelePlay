import type { Response } from 'express';
import type { ChunkingService } from '../chunking/ChunkingService.js';
import type { ChunkMetadata } from '../../types/chunking/ChunkingTypes.js';
import type { StreamingSession } from '../../types/streaming/StreamingTypes.js';
import fs from 'fs';
import path from 'path';
import prisma from '../../lib/prisma.js';
import {
  appendOutputCodecArgs,
  attachResponseCleanup,
  getStreamingMimeType,
  resolveInputCodecArgs,
  resolveLiveOutputArgs,
  spawnFfmpeg,
  type StreamingOutputFormat
} from '../../utils/streaming/streamingFfmpegUtils.js';
export class StreamingChunkService {
  constructor(private readonly chunkingService: ChunkingService) {}

  getSessionChunkDuration(session: StreamingSession): number {
    return session.chunkDuration ?? 10;
  }

  async resolveSessionChunk(session: StreamingSession, indexRaw: string): Promise<ChunkMetadata | null> {
    const chunkDuration = this.getSessionChunkDuration(session);
    const chunks = await this.chunkingService.getAllChunks(session.filePath, { chunkDuration });
    const idx = parseInt(indexRaw, 10);
    return Number.isFinite(idx) ? (chunks[idx] ?? null) : null;
  }

  buildChunkStreamArgs(
    session: StreamingSession,
    filePath: string,
    chunk: ChunkMetadata,
    outputFormat: StreamingOutputFormat
  ): string[] {
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
  }

  buildChunkPeaksArgs(session: StreamingSession, filePath: string, chunk: ChunkMetadata): string[] {
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
  }

  applyChunkStreamHeaders(res: Response, mimeType: string): void {
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Transfer-Encoding', 'chunked');
    res.removeHeader('Accept-Ranges');
  }

  calculatePeaks(buffer: Buffer, bins: number): number[] {
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
  }

  async getChunkPeaks(session: StreamingSession, chunk: ChunkMetadata, bins: number): Promise<number[]> {
    const filePath = path.resolve(session.filePath);
    const args = this.buildChunkPeaksArgs(session, filePath, chunk);

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
        resolve(this.calculatePeaks(Buffer.concat(chunksBuf), bins));
      });
      ffmpeg.on('error', reject);
    });
  }

  streamLive(session: StreamingSession, res: Response): void {
    const filePath = path.resolve(session.filePath);
    const outputFormat: StreamingOutputFormat = session.outputFormat || 'mp3';
    this.applyChunkStreamHeaders(res, getStreamingMimeType(outputFormat));

    const args: string[] = [...resolveInputCodecArgs(session), '-i', filePath, '-map', '0:a:0', '-vn'];
    appendOutputCodecArgs(args, outputFormat, session);
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
          await prisma.mediaFile.update({
            where: { id: session.fileId },
            data: { decodedPath: path.resolve(liveOutput.savePath), status: 'ready' }
          });
        } catch (error) {
          console.warn('Failed to update decodedPath after live stream:', error);
        }
      }
    });
    ffmpeg.on('error', (error) => {
      console.error('FFmpeg stream error:', error);
    });
  }

  async streamFileBased(session: StreamingSession, range: string | undefined, res: Response): Promise<void> {
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
  }

  streamChunk(
    session: StreamingSession,
    chunk: ChunkMetadata,
    requestedFormat: string | undefined,
    res: Response
  ): void {
    const filePath = path.resolve(session.filePath);
    const outputFormat: StreamingOutputFormat =
      requestedFormat === 'mp3' || requestedFormat === 'wav'
        ? requestedFormat
        : (session.outputFormat || 'mp3');

    this.applyChunkStreamHeaders(res, getStreamingMimeType(outputFormat));
    const args = this.buildChunkStreamArgs(session, filePath, chunk, outputFormat);
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
  }
}

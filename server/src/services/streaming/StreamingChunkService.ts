import type { Response } from 'express';
import type { ChunkingService } from '../chunking/ChunkingService.js';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import prisma from '../../lib/prisma.js';
export class StreamingChunkService {
  constructor(private readonly chunkingService: ChunkingService) {}
  getSessionChunkDuration(session: any): number {
    return session.chunkDuration ?? 10;
  }

  async resolveSessionChunk(session: any, indexRaw: string): Promise<any | null> {
    const chunkDuration = this.getSessionChunkDuration(session);
    const chunks = await this.chunkingService.getAllChunks(session.filePath, { chunkDuration });
    const idx = parseInt(indexRaw, 10);
    return Number.isFinite(idx) ? (chunks[idx] ?? null) : null;
  }

  resolveInputCodecArgs(session: any): string[] {
    const args: string[] = [];
    if (!session.inputCodec) return args;

    const codec = session.inputCodec;
    const inputFormatMap: Record<string, string> = {
      g711: 'mulaw',
      g711a: 'alaw',
      g726: 'g726',
      g728: 'g728',
      pcm_s16le: 's16le',
      pcm_s24le: 's24le'
    };
    if (codec in inputFormatMap) {
      args.push('-f', inputFormatMap[codec]!);
    }

    if (codec === 'g726' && session.bitrate) {
      const codeSize = Math.floor(session.bitrate / 8);
      args.push('-code_size', codeSize.toString());
      args.push('-acodec', 'g726');
      if (session.sampleRate) {
        args.push('-sample_rate', session.sampleRate.toString());
      }
    } else if (codec === 'g711') {
      args.push('-acodec', 'pcm_mulaw');
    } else if (codec === 'g711a') {
      args.push('-acodec', 'pcm_alaw');
    } else if (codec === 'g728') {
      args.push('-acodec', 'g728');
    }

    if (session.sampleRate && codec !== 'g726') {
      args.push('-ar', session.sampleRate.toString());
    }
    if (session.channels) {
      args.push('-ac', session.channels.toString());
    }
    return args;
  }

  buildChunkStreamArgs(session: any, filePath: string, chunk: any, outputFormat: 'mp3' | 'wav'): string[] {
    const args: string[] = [
      ...this.resolveInputCodecArgs(session),
      '-i', filePath,
      '-ss', chunk.startTime.toString(),
      '-t', chunk.duration.toString(),
      '-map', '0:a:0',
      '-vn'
    ];

    if (outputFormat === 'mp3') {
      args.push('-acodec', 'libmp3lame');
    } else {
      args.push('-acodec', 'pcm_s16le');
      if (session.sampleRate) {
        args.push('-ar', session.sampleRate.toString());
      }
      if (session.channels) {
        args.push('-ac', session.channels.toString());
      }
    }
    args.push('-f', outputFormat);
    args.push('pipe:1');
    return args;
  }

  buildChunkPeaksArgs(session: any, filePath: string, chunk: any): string[] {
    return [
      ...this.resolveInputCodecArgs(session),
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


  async getChunkPeaks(session: any, chunk: any, bins: number): Promise<number[]> {
    const filePath = path.resolve(session.filePath);
    const args = this.buildChunkPeaksArgs(session, filePath, chunk);

    return await new Promise<number[]>((resolve, reject) => {
      const ff = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] });
      const chunksBuf: Buffer[] = [];
      let stderr = '';

      ff.stdout.on('data', (data: Buffer) => chunksBuf.push(data));
      ff.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      ff.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`FFmpeg failed: ${stderr}`));
          return;
        }
        const buffer = Buffer.concat(chunksBuf);
        resolve(this.calculatePeaks(buffer, bins));
      });

      ff.on('error', (err) => {
        reject(err);
      });
    });
  }

  streamLive(session: any, res: Response): void {
    const filePath = path.resolve(session.filePath);
    const outputFormat = session.outputFormat || 'mp3';
    const mimeType = outputFormat === 'mp3' ? 'audio/mpeg' : 'audio/wav';

    this.applyChunkStreamHeaders(res, mimeType);

    const args: string[] = [...this.resolveInputCodecArgs(session)];
    args.push('-i', filePath);
    args.push('-map', '0:a:0');
    args.push('-vn');

    if (outputFormat === 'mp3') {
      args.push('-acodec', 'libmp3lame');
    } else if (outputFormat === 'wav') {
      args.push('-acodec', 'pcm_s16le');
      if (session.sampleRate) {
        args.push('-ar', session.sampleRate.toString());
      }
      if (session.channels) {
        args.push('-ac', session.channels.toString());
      }
    }

    if (session.saveOutputPath) {
      const savePath = path.resolve(session.saveOutputPath).replace(/\\/g, '/');
      const saveDir = path.dirname(savePath);
      if (!fs.existsSync(saveDir)) {
        fs.mkdirSync(saveDir, { recursive: true });
      }
      const teeTarget = `[f=${outputFormat}]pipe:1|[f=${outputFormat}]${savePath}`;
      args.push('-f', 'tee', teeTarget);
    } else {
      args.push('-f', outputFormat);
      args.push('pipe:1');
    }

    const ff = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    const cleanup = () => {
      if (!ff.killed) {
        ff.kill('SIGTERM');
      }
    };
    res.on('close', cleanup);
    res.on('error', cleanup);

    ff.stdout.pipe(res);
    ff.stderr.on('data', (data: Buffer) => {
      console.warn('FFmpeg stream:', data.toString());
    });

    ff.on('close', async (code) => {
      if (code === 0 && session.saveOutputPath && session.fileId) {
        try {
          await prisma.mediaFile.update({
            where: { id: session.fileId },
            data: { decodedPath: path.resolve(session.saveOutputPath), status: 'ready' }
          });
        } catch (e) {
          console.warn('Failed to update decodedPath after live stream:', e);
        }
      }
    });

    ff.on('error', (err) => {
      console.error('FFmpeg stream error:', err);
    });
  }

  async streamFileBased(session: any, range: string | undefined, res: Response): Promise<void> {
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

  streamChunk(session: any, chunk: any, requestedFormat: string | undefined, res: Response): void {
    const filePath = path.resolve(session.filePath);
    const outputFormat = (requestedFormat === 'mp3' || requestedFormat === 'wav')
      ? requestedFormat
      : (session.outputFormat || 'mp3');
    const mimeType = outputFormat === 'mp3' ? 'audio/mpeg' : 'audio/wav';

    this.applyChunkStreamHeaders(res, mimeType);
    const args = this.buildChunkStreamArgs(session, filePath, chunk, outputFormat);

    const ff = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    const cleanup = () => {
      if (!ff.killed) {
        ff.kill('SIGTERM');
      }
    };
    res.on('close', cleanup);
    res.on('error', cleanup);

    ff.stdout.pipe(res);
    ff.stderr.on('data', (data: Buffer) => {
      console.warn('FFmpeg chunk stream:', data.toString());
    });
    ff.on('error', (err) => {
      console.error('FFmpeg chunk stream error:', err);
    });
  }
}

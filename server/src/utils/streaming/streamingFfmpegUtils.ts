import type { ChildProcess } from 'child_process';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import type { Response } from 'express';
import type { StreamingSession } from '../../types/streaming/StreamingTypes.js';

export type StreamingOutputFormat = 'mp3' | 'wav';

interface StreamableSession {
  inputCodec?: string;
  sampleRate?: number;
  channels?: number;
  bitrate?: number;
}

export function resolveInputCodecArgs(session: StreamableSession): string[] {
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
  const inputFormat = inputFormatMap[codec];
  if (inputFormat) {
    args.push('-f', inputFormat);
  }

  if (codec === 'g726' && session.bitrate) {
    const codeSize = Math.floor(session.bitrate / 8);
    args.push('-code_size', codeSize.toString(), '-acodec', 'g726');
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

export function appendOutputCodecArgs(
  args: string[],
  outputFormat: StreamingOutputFormat,
  session: StreamableSession
): void {
  if (outputFormat === 'mp3') {
    args.push('-acodec', 'libmp3lame');
    return;
  }
  args.push('-acodec', 'pcm_s16le');
  if (session.sampleRate) {
    args.push('-ar', session.sampleRate.toString());
  }
  if (session.channels) {
    args.push('-ac', session.channels.toString());
  }
}

export function getStreamingMimeType(format: StreamingOutputFormat): string {
  return format === 'mp3' ? 'audio/mpeg' : 'audio/wav';
}

export function spawnFfmpeg(args: string[]): ChildProcess {
  return spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] });
}

export function attachResponseCleanup(
  process: ChildProcess,
  res: Response
): void {
  const cleanup = () => {
    if (!process.killed) {
      process.kill('SIGTERM');
    }
  };
  res.on('close', cleanup);
  res.on('error', cleanup);
}

export function resolveLiveOutputArgs(
  session: StreamingSession,
  outputFormat: StreamingOutputFormat
): { args: string[]; savePath?: string } {
  if (!session.saveOutputPath) {
    return { args: ['-f', outputFormat, 'pipe:1'] };
  }
  const savePath = path.resolve(session.saveOutputPath).replace(/\\/g, '/');
  const saveDir = path.dirname(savePath);
  if (!fs.existsSync(saveDir)) {
    fs.mkdirSync(saveDir, { recursive: true });
  }
  const teeTarget = `[f=${outputFormat}]pipe:1|[f=${outputFormat}]${savePath}`;
  return { args: ['-f', 'tee', teeTarget], savePath };
}

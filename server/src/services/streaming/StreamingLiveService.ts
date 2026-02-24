import type { Response } from 'express';
import type { StreamingSession } from '../../types/streaming/StreamingTypes.js';
import path from 'path';
import {
  attachResponseCleanup,
  getStreamingMimeType,
  resolveLiveOutputArgs,
  spawnFfmpeg,
  type StreamingOutputFormat
} from '../../utils/streaming/streamingFfmpegUtils.js';
import { applyChunkStreamHeaders, buildLiveStreamArgs } from './StreamingChunkHelpers.js';
import { fileRepository } from '../../repositories/file/FileRepository.js';

export const streamLive = (session: StreamingSession, res: Response): void => {
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

export const streamingLiveService = {
  streamLive
};

export type StreamingLiveService = typeof streamingLiveService;

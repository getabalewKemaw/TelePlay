import { promises as fs } from 'fs';
import path from 'path';
import { ffmpegService } from '../ffmpeg/FFmpegService.js';
import {
  buildDecodedOutputPath,
  buildTempDecodedOutputPath,
  inferDecodeCodec,
  inferSampleRate,
  inferChannels,
  inferG726Bitrate
} from '../../utils/fileUtils.js';
import { fileRepository } from '../../repositories/file/FileRepository.js';

type FileRecord = {
  id: string;
  filename: string;
  originalPath: string;
  duration?: number | null;
  decodedPath?: string | null;
  codec?: string | null;
  bitrate?: number | null;
};

const activeAutoDecodeJobs = new Set<string>();
const decodeProgressStep = 1;

const tryAutoDecode = async (file: FileRecord): Promise<void> => {
  if (file.decodedPath) {
    await fileRepository.updateStatusReady(file.id);
    return;
  }
  const finalOutputPath = buildDecodedOutputPath(file.filename);
  const tempOutputPath = buildTempDecodedOutputPath(file.id, file.filename);
  try {
    await fs.access(finalOutputPath);
    await fileRepository.updateStatusReady(file.id, finalOutputPath);
    return;
  } catch {
    // output does not exist, continue and decode
  }

  await fs.mkdir(path.dirname(finalOutputPath), { recursive: true });
  await fileRepository.updateStatusProcessing(file.id, 0, 'processing');

  const codec = inferDecodeCodec(file.filename, file.codec);
  const sampleRate = inferSampleRate(codec);
  const channels = inferChannels(codec);
  const bitrate = codec === 'g726' ? inferG726Bitrate(file.bitrate) : undefined;
  let lastPersistedProgress = -decodeProgressStep;
  const totalDurationMs = (file.duration && Number.isFinite(file.duration) && file.duration > 0)
    ? file.duration * 1000
    : undefined;

  await fs.rm(tempOutputPath, { force: true }).catch(() => undefined);

  await ffmpegService.decode({
    input: { path: file.originalPath },
    output: { path: tempOutputPath, format: 'mp3' },
    codec,
    sampleRate,
    channels,
    bitrate,
    onProgress: (update) => {
      if (!totalDurationMs || typeof update.out_time_ms !== 'number') return;
      const progress = Math.floor(Math.max(0, Math.min(100, (update.out_time_ms / totalDurationMs) * 100)));
      if (progress < lastPersistedProgress + decodeProgressStep && progress !== 100) return;
      lastPersistedProgress = progress;
      void fileRepository.updateProgress(file.id, progress).catch(() => undefined);
    }
  });

  await fs.rename(tempOutputPath, finalOutputPath);
  await fileRepository.updateStatusReady(file.id, finalOutputPath);
};

const scheduleAutoDecode = (file: FileRecord): void => {
  if (file.decodedPath) return;
  if (activeAutoDecodeJobs.has(file.id)) return;
  activeAutoDecodeJobs.add(file.id);
  void tryAutoDecode(file)
    .catch(async (error) => {
      await fileRepository.updateStatusError(
        file.id,
        error instanceof Error ? error.message : String(error)
      ).catch(() => undefined);
      console.error(`Auto decode failed for file ${file.originalPath}:`, error);
    })
    .finally(() => {
      const tempOutputPath = buildTempDecodedOutputPath(file.id, file.filename);
      void fs.rm(tempOutputPath, { force: true }).catch(() => undefined);
      activeAutoDecodeJobs.delete(file.id);
    });
};

export const fileDecodeService = {
  scheduleAutoDecode
};

export type FileDecodeService = typeof fileDecodeService;
export type { FileRecord };

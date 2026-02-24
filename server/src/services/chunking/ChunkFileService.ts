import type { ChunkMetadata } from '../../types/chunking/ChunkingTypes.js';
import { ffmpegService } from '../ffmpeg/FFmpegService.js';
import { existsSync, mkdirSync } from 'fs';

const ensureOutputDirectory = (outputDirectory: string): void => {
  if (!existsSync(outputDirectory)) {
    mkdirSync(outputDirectory, { recursive: true });
  }
};

const writeChunkFiles = async (filePath: string, chunks: ChunkMetadata[]): Promise<void> => {
  for (const chunk of chunks) {
    if (!chunk.filePath) continue;
    await ffmpegService.decode({
      input: { path: filePath },
      output: { path: chunk.filePath },
      startTime: chunk.startTime,
      duration: chunk.duration
    });
  }
};

export const chunkFileService = {
  ensureOutputDirectory,
  writeChunkFiles
};

export type ChunkFileService = typeof chunkFileService;

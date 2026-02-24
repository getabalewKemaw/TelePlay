import type { ChunkingConfig, ChunkMetadata } from '../../types/chunking/ChunkingTypes.js';
import path from 'path';

export const calculateChunks = (config: ChunkingConfig): ChunkMetadata[] => {
  const chunks: ChunkMetadata[] = [];
  const totalDuration = config.totalDuration;
  const chunkDuration = config.chunkDuration;

  const numChunks = Math.ceil(totalDuration / chunkDuration);

  for (let i = 0; i < numChunks; i++) {
    const startTime = i * chunkDuration;
    const endTime = Math.min(startTime + chunkDuration, totalDuration);
    const duration = endTime - startTime;

    const chunk: ChunkMetadata = {
      index: i,
      startTime,
      endTime,
      duration
    };

    if (config.generateFiles && config.outputDirectory) {
      const extension = path.extname(config.baseFilename || 'chunk');
      const baseName = path.basename(config.baseFilename || 'chunk', extension);
      chunk.filePath = path.join(
        config.outputDirectory,
        `${baseName}_chunk_${i.toString().padStart(4, '0')}${extension}`
      );
    }
    chunks.push(chunk);
  }
  return chunks;
};

export const chunkingCalculator = {
  calculateChunks
};

export type ChunkingCalculator = typeof chunkingCalculator;

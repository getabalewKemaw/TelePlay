import { getSessionChunkDuration } from './StreamingChunkHelpers.js';
import { streamLive } from './StreamingLiveService.js';
import { streamFileBased } from './StreamingFileBasedService.js';
import { resolveSessionChunk, getChunkPeaks, streamChunk } from './StreamingChunkOperations.js';

export const streamingChunkService = {
  getSessionChunkDuration,
  resolveSessionChunk,
  getChunkPeaks,
  streamLive,
  streamFileBased,
  streamChunk
};

export type StreamingChunkService = typeof streamingChunkService;

/**
 * Prepares processed chunks for network streaming with playback controls
 */
import type {
  StreamingSession,
  StreamingPreparationOptions
} from '../../types/streaming/StreamingTypes.js';
import { streamingValidationError } from '../../errors/streaming/StreamingErrors.js';
import { randomUUID } from 'crypto';
import { existsSync } from 'fs';

const DEFAULT_OPTIONS: Required<StreamingPreparationOptions> = {
  transport: 'http',
  mode: 'file-based',
  targetCodec: 'aac',
  compressionLevel: 'medium',
  preTranscode: true,
  preCompress: false,
  bufferSize: 10,
  chunkDuration: 10,
  inputCodec: 'g711',
  sampleRate: 8000,
  channels: 1,
  bitrate: 32,
  outputFormat: 'mp3',
  saveOutputPath: '',
  fileId: ''
};

const sessions = new Map<string, StreamingSession>();

export const createSession = async (
  filePath: string,
  options?: StreamingPreparationOptions
): Promise<StreamingSession> => {
  if (!existsSync(filePath)) {
    throw streamingValidationError(`Media file does not exist: ${filePath}`, 'filePath');
  }
  const sessionId = randomUUID();
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const session: StreamingSession = {
    sessionId,
    filePath,
    state: 'idle',
    currentTime: 0,
    transport: opts.transport,
    mode: opts.mode,
    chunkDuration: opts.chunkDuration,
    targetCodec: opts.targetCodec,
    compressionLevel: opts.compressionLevel,
    preTranscode: opts.preTranscode,
    preCompress: opts.preCompress,
    bufferSize: opts.bufferSize,
    inputCodec: options?.inputCodec,
    sampleRate: options?.sampleRate,
    channels: options?.channels,
    bitrate: options?.bitrate,
    outputFormat: options?.outputFormat,
    saveOutputPath: options?.saveOutputPath,
    fileId: options?.fileId,
    startedAt: Date.now(),
    lastActivity: Date.now()
  };
  sessions.set(sessionId, session);
  return session;
};

export const getSession = async (sessionId: string): Promise<StreamingSession | undefined> => (
  sessions.get(sessionId)
);

export const streamingPreparationService = {
  createSession,
  getSession
};

export type StreamingPreparationService = typeof streamingPreparationService;

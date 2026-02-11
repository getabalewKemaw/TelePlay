/**
 * Prepares processed chunks for network streaming with playback controls
 */
import type { IStreamingPreparationService } from '../../interfaces/streaming/IStreamingPreparationService.js';
import type { IChunkingService } from '../../interfaces/chunking/IChunkingService.js';
import type { ITranscodingService } from '../../interfaces/transcoding/ITranscodingService.js';
import type { ICompressionService } from '../../interfaces/compression/ICompressionService.js';
import type {
  StreamingSession,
  PreparedChunk,
  PreparedSegment,
  PlaybackControlRequest,
  PlaybackControlResponse,
  StreamingPreparationOptions,
  StreamMetadata,
  PlaybackState
} from '../../types/streaming/StreamingTypes.js';
import { StreamingSessionError, StreamingPlaybackError, StreamingValidationError } from '../../errors/streaming/StreamingErrors.js';
import { randomUUID } from 'crypto';
import { existsSync } from 'fs';
import { promises as fs } from 'fs';
import path from 'path';
const DEFAULT_OPTIONS: Required<StreamingPreparationOptions> = {
  transport: 'http',
  mode: 'file-based',
  targetCodec: 'aac',
  compressionLevel: 'medium',
  preTranscode: true,
  preCompress: false,
  bufferSize: 10,
  chunkDuration: 10
};
export class StreamingPreparationService implements IStreamingPreparationService {
  private readonly chunkingService: IChunkingService;
  private readonly transcodingService: ITranscodingService;
  private readonly compressionService: ICompressionService;
  private readonly sessions: Map<string, StreamingSession>;
  constructor(
    chunkingService: IChunkingService,
    transcodingService: ITranscodingService,
    compressionService: ICompressionService
  ) {
    this.chunkingService = chunkingService;
    this.transcodingService = transcodingService;
    this.compressionService = compressionService;
    this.sessions = new Map();
  }
  async createSession(
    filePath: string,
    options?: StreamingPreparationOptions
  ): Promise<StreamingSession> {
    if (!existsSync(filePath)) {
      throw new StreamingValidationError(`Media file does not exist: ${filePath}`, 'filePath');
    }
    const sessionId = randomUUID();
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const session: StreamingSession = {
      sessionId,
      filePath,
      state: 'idle',
      currentTime: 0,
      preparedSegments: [],
      transport: opts.transport,
      mode: opts.mode,
      chunkDuration: opts.chunkDuration,
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
    this.sessions.set(sessionId, session);
    return session;
  }
// prepare chunks for streaming.
  async prepareChunks(
    sessionId: string,
    chunkIndices?: number[]
  ): Promise<PreparedChunk[]> {
    const session = this.findSessionOrThrow(sessionId);

    const chunks = await this.chunkingService.getAllChunks(session.filePath);

    // filter to requested chunks if provided
    const chunksToPrepare = chunkIndices
      ? chunks.filter((_, idx) => chunkIndices.includes(idx))
      : chunks;

    const preparedChunks: PreparedChunk[] = [];
    for (const chunk of chunksToPrepare) {
      const prepared = await this.prepareSingleChunk(session, chunk);
      preparedChunks.push(prepared);
    }

    return preparedChunks;
  }
  async handlePlaybackControl(
    sessionId: string,
    request: PlaybackControlRequest
  ): Promise<PlaybackControlResponse> {
    const session = this.findSessionOrThrow(sessionId);

    let newState: PlaybackState = session.state;
    let newTime = session.currentTime;
    let chunksToLoad: PreparedChunk[] = [];
    let segmentsToLoad: PreparedSegment[] = [];

    switch (request.action) {
      case 'play':
        if (session.state === 'paused' || session.state === 'ready') {
          newState = 'playing';
        }
        break;
      case 'pause':
        if (session.state === 'playing') {
          newState = 'paused';
        }
        break;

      case 'seek':
        if (request.targetTime !== undefined) {
          newTime = request.targetTime;
          newState = 'seeking';
          const result = await this.getChunksForTime(sessionId, newTime);
          chunksToLoad = result;
          // get segments containing these chunks
          segmentsToLoad = session.preparedSegments.filter(seg =>
            seg.chunks.some(c => chunksToLoad.includes(c))
          );
          newState = 'ready';
        }
        break;

      case 'fast-forward':
        if (request.amount) {
          newTime = Math.min(
            session.currentTime + request.amount,
            await this.getTotalDuration(sessionId)
          );
          newState = 'seeking';

          const result = await this.getChunksForTime(sessionId, newTime);
          chunksToLoad = result;

          newState = 'ready';
        }
        break;

      case 'rewind':
        if (request.amount) {
          newTime = Math.max(0, session.currentTime - request.amount);
          newState = 'seeking';
          const result = await this.getChunksForTime(sessionId, newTime);
          chunksToLoad = result;

          newState = 'ready';
        }
        break;

      case 'stop':
        newState = 'idle';
        newTime = 0;
        break;

      default:
        throw new StreamingPlaybackError(
          `Unknown playback action: ${request.action}`,
          request.action
        );
    }

    // update the  session
    session.state = newState;
    session.currentTime = newTime;
    session.lastActivity = Date.now();
    return {
      state: newState,
      currentTime: newTime,
      chunksToLoad,
      segmentsToLoad,
      success: true
    };
  }

  // get chunks needed for the current playback soln
  private async getChunksForTime(sessionId: string, time: number): Promise<PreparedChunk[]> {
    const session = this.findSessionOrThrow(sessionId);
    const chunk = await this.chunkingService.getChunkAtTime(session.filePath, time);
    const allPreparedChunks: PreparedChunk[] = [];
    session.preparedSegments.forEach(seg => {
      allPreparedChunks.push(...seg.chunks);
    });
    const bufferSize = 10; // seconds
    const targetChunks = allPreparedChunks.filter(prepared => {
      const chunkTime = prepared.chunk.startTime;
      return chunkTime >= time - bufferSize && chunkTime <= time + bufferSize;
    });

    // If chunks not prepared, prepare them
    if (targetChunks.length === 0) {
      const chunks = await this.chunkingService.getAllChunks(session.filePath);
      const chunkAtTime = chunks.find(c =>
        c.startTime <= time && c.endTime > time
      );

      if (chunkAtTime) {
        const prepared = await this.prepareSingleChunk(session, chunkAtTime);
        return [prepared];
      }
    }

    return targetChunks;
  }

  async getStreamMetadata(sessionId: string): Promise<StreamMetadata> {
    const session = this.findSessionOrThrow(sessionId);
 //get chunks to determine duration
    const chunks = await this.chunkingService.getAllChunks(session.filePath);
    const duration = chunks.length > 0 ? chunks[chunks.length - 1]!.endTime : 0;
    return {
      streamId: sessionId,
      filePath: session.filePath,
      duration,
      codec: 'aac', 
      sampleRate: 44100,
      channels: 2,
      mimeType: this.getMimeTypeForCodec(session)
    };
  }

  async cleanupSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      this.sessions.delete(sessionId);
      // we need to delte the processed files after some times/in production
    }
  }

  private async prepareSingleChunk(
    session: StreamingSession,
    chunk: any
  ): Promise<PreparedChunk> {
    const options = this.getSessionOptions(session);
    let streamPath = chunk.filePath || '';
    let transcodedPath: string | undefined;
    let compressedPath: string | undefined;

    // Step 1: Transcode if needed
    if (options.preTranscode && chunk.filePath) {
      try {
        const targetCodec = this.transcodingService.getRecommendedTargetCodec('g711');
        const transcoded = await this.transcodingService.transcodeChunk({
          inputPath: chunk.filePath,
          outputPath: this.generateTempPath(chunk.filePath, 'transcoded'),
          sourceEncoding: {
            codec: 'g711' as any,
            sampleRate: 8000,
            channels: 1
          },
          targetEncoding: {
            codec: targetCodec as any,
            sampleRate: 44100,
            channels: 2
          }
        });
        transcodedPath = transcoded.outputPath;
        streamPath = transcodedPath;
      } catch (error) {
    
        console.warn('Transcoding failed, using original:', error);
      }
    }

    // Step 2: Compress if needed
    if (options.preCompress && streamPath) {
      try {
        const compressed = await this.compressionService.compress(streamPath, {
          level: options.compressionLevel as any
        });
        compressedPath = compressed.outputPath;
        streamPath = compressedPath;
      } catch (error) {
        console.warn('Compression failed, using previous:', error);
      }
    }
// get final file size
    let size = 0;
    if (existsSync(streamPath)) {
      const stats = await fs.stat(streamPath);
      size = stats.size;
    }
    return {
      chunk,
      transcodedPath,
      compressedPath,
      streamPath,
      status: 'ready',
      size,
      mimeType: this.getMimeTypeForCodec(session),
      preparedAt: Date.now()
    };
  }
// get the session by the ids .
  async getSession(sessionId: string): Promise<StreamingSession | undefined> {
    return this.sessions.get(sessionId);
  }
  private findSessionOrThrow(sessionId: string): StreamingSession {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new StreamingSessionError(`Session not found: ${sessionId}`, sessionId);
    }
    return session;
  }

  private getSessionOptions(session: StreamingSession): Required<StreamingPreparationOptions> {
    return DEFAULT_OPTIONS;
  }

  private getMimeTypeForCodec(session: StreamingSession): string {
    const codecMimeTypes: Record<string, string> = {
      aac: 'audio/aac',
      mp3: 'audio/mpeg',
      opus: 'audio/opus',
      pcm_s16le: 'audio/wav'
    };

    return codecMimeTypes['aac'] || 'audio/aac';
  }
  private generateTempPath(originalPath: string, suffix: string): string {
    const dir = path.dirname(originalPath);
    const ext = path.extname(originalPath);
    const baseName = path.basename(originalPath, ext);
    return path.join(dir, `${baseName}_${suffix}${ext}`);
  }

  private async getTotalDuration(sessionId: string): Promise<number> {
    const session = this.findSessionOrThrow(sessionId);
    const chunks = await this.chunkingService.getAllChunks(session.filePath);
    return chunks.length > 0 ? chunks[chunks.length - 1]!.endTime : 0;
  }
}

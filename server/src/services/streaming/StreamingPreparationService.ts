/**
 * Streaming Preparation Service – Bridge Processing → Streaming
 * Prepares processed chunks for network streaming with playback controls
 */

import type { IStreamingPreparationService } from '../../interfaces/streaming/IStreamingPreparationService.js';
import type { IChunkingService } from '../../interfaces/streaming/IChunkingService.js';
import type { ISegmentationService } from '../../interfaces/streaming/ISegmentationService.js';
import type { ITranscodingService } from '../../interfaces/streaming/ITranscodingService.js';
import type { ICompressionService } from '../../interfaces/streaming/ICompressionService.js';
import type {
  StreamingSession,
  PreparedChunk,
  PreparedSegment,
  PlaybackControlRequest,
  PlaybackControlResponse,
  StreamingPreparationOptions,
  StreamMetadata,
  StreamEndpoint,
  PlaybackState,
  TransportProtocol
} from '../../types/streaming/StreamingTypes.js';
import { StreamingSessionError, StreamingPlaybackError, StreamingValidationError } from '../../errors/streaming/StreamingErrors.js';
import { randomUUID } from 'crypto';
import { existsSync } from 'fs';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Default streaming preparation options
 */
const DEFAULT_OPTIONS: Required<StreamingPreparationOptions> = {
  transport: 'http',
  mode: 'file-based',
  targetCodec: 'aac',
  compressionLevel: 'medium',
  preTranscode: true,
  preCompress: false,
  bufferSize: 10
};

/**
 * Streaming Preparation Service Implementation
 * 
 * Responsibilities:
 * - Prepare chunks/segments for streaming
 * - Handle playback controls (play, pause, seek, ff, rewind)
 * - Integrate chunking, segmentation, transcoding, compression
 * - Provide transport-agnostic streaming interface
 */
export class StreamingPreparationService implements IStreamingPreparationService {
  private readonly chunkingService: IChunkingService;
  private readonly segmentationService: ISegmentationService;
  private readonly transcodingService: ITranscodingService;
  private readonly compressionService: ICompressionService;
  private readonly sessions: Map<string, StreamingSession>;

  /**
   * Constructor with dependency injection
   */
  constructor(
    chunkingService: IChunkingService,
    segmentationService: ISegmentationService,
    transcodingService: ITranscodingService,
    compressionService: ICompressionService
  ) {
    this.chunkingService = chunkingService;
    this.segmentationService = segmentationService;
    this.transcodingService = transcodingService;
    this.compressionService = compressionService;
    this.sessions = new Map();
  }

  /**
   * Create a streaming session
   */
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
      startedAt: Date.now(),
      lastActivity: Date.now()
    };

    this.sessions.set(sessionId, session);

    return session;
  }

  /**
   * Prepare chunks for streaming
   */
  async prepareChunks(
    sessionId: string,
    chunkIndices?: number[]
  ): Promise<PreparedChunk[]> {
    const session = this.findSessionOrThrow(sessionId);

    // Get chunks from chunking service
    const chunks = await this.chunkingService.getAllChunks(session.filePath);

    // Filter to requested chunks if provided
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

  /**
   * Prepare segments for streaming
   */
  async prepareSegments(
    sessionId: string,
    segmentIndices?: number[]
  ): Promise<PreparedSegment[]> {
    const session = this.findSessionOrThrow(sessionId);

    // Get segments from segmentation service
    const segments = await this.segmentationService.getAllSegments(session.filePath);

    // Filter to requested segments if provided
    const segmentsToPrepare = segmentIndices
      ? segments.filter((_, idx) => segmentIndices.includes(idx))
      : segments;

    const preparedSegments: PreparedSegment[] = [];

    for (const segment of segmentsToPrepare) {
      const preparedChunks: PreparedChunk[] = [];

      // Prepare each chunk in the segment
      for (const chunk of segment.chunks) {
        const prepared = await this.prepareSingleChunk(session, chunk);
        preparedChunks.push(prepared);
      }

      const isReady = preparedChunks.every(c => c.status === 'ready');
      const totalSize = preparedChunks.reduce((sum, c) => sum + c.size, 0);

      preparedSegments.push({
        segment,
        chunks: preparedChunks,
        status: isReady ? 'ready' : 'processing',
        totalSize,
        isReady
      });
    }

    session.preparedSegments = preparedSegments;
    return preparedSegments;
  }

  /**
   * Handle playback control (play, pause, seek, etc.)
   */
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

          // Get chunks/segments for new position
          const result = await this.getChunksForTime(sessionId, newTime);
          chunksToLoad = result;

          // Get segments containing these chunks
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

    // Update session
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

  /**
   * Get chunks needed for current playback position
   */
  async getChunksForTime(sessionId: string, time: number): Promise<PreparedChunk[]> {
    const session = this.findSessionOrThrow(sessionId);

    // Get chunk at time from chunking service
    const chunk = await this.chunkingService.getChunkAtTime(session.filePath, time);

    // Find prepared chunks for this chunk and nearby chunks
    const allPreparedChunks: PreparedChunk[] = [];
    session.preparedSegments.forEach(seg => {
      allPreparedChunks.push(...seg.chunks);
    });

    // Find chunks around the target time (current chunk + buffer)
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

  /**
   * Get stream endpoint information
   */
  async getStreamEndpoint(sessionId: string, chunkIndex?: number): Promise<StreamEndpoint> {
    const session = this.findSessionOrThrow(sessionId);

    // Build endpoint URL based on transport protocol
    let url: string;
    let mimeType: string;

    switch (session.transport) {
      case 'http':
        url = `/stream/${sessionId}${chunkIndex !== undefined ? `/${chunkIndex}` : ''}`;
        mimeType = this.getMimeTypeForCodec(session);
        break;

      case 'websocket':
        url = `ws://localhost/stream/${sessionId}`;
        mimeType = 'application/octet-stream';
        break;

      case 'rtp':
        url = `rtp://localhost:5004/${sessionId}`;
        mimeType = 'application/rtp';
        break;

      case 'webrtc':
        url = `webrtc://localhost/${sessionId}`;
        mimeType = 'application/webrtc';
        break;

      default:
        url = `/stream/${sessionId}`;
        mimeType = 'audio/aac';
    }

    return {
      url,
      protocol: session.transport,
      mimeType,
      headers: session.transport === 'http' ? {
        'Content-Type': mimeType,
        'Accept-Ranges': 'bytes'
      } : undefined
    };
  }

  /**
   * Get stream metadata
   */
  async getStreamMetadata(sessionId: string): Promise<StreamMetadata> {
    const session = this.findSessionOrThrow(sessionId);

    // Get chunks to determine duration
    const chunks = await this.chunkingService.getAllChunks(session.filePath);
    const duration = chunks.length > 0 ? chunks[chunks.length - 1]!.endTime : 0;

    return {
      streamId: sessionId,
      filePath: session.filePath,
      duration,
      codec: 'aac', // Default target codec
      sampleRate: 44100,
      channels: 2,
      mimeType: this.getMimeTypeForCodec(session)
    };
  }

  /**
   * Cleanup session
   */
  async cleanupSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      // Cleanup prepared files if needed
      // In production, you might want to delete temporary transcoded/compressed files
      this.sessions.delete(sessionId);
    }
  }

  /**
   * Prepare a single chunk for streaming
   */
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
        // If transcoding fails, use original
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
        // If compression fails, use transcoded/original
        console.warn('Compression failed, using previous:', error);
      }
    }

    // Get final file size
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

  /**
   * Get session by ID (Public interface)
   */
  async getSession(sessionId: string): Promise<StreamingSession | undefined> {
    return this.sessions.get(sessionId);
  }

  /**
   * Get session (with error handling)
   */
  private findSessionOrThrow(sessionId: string): StreamingSession {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new StreamingSessionError(`Session not found: ${sessionId}`, sessionId);
    }
    return session;
  }

  /**
   * Get session options
   */
  private getSessionOptions(session: StreamingSession): Required<StreamingPreparationOptions> {
    // In a full implementation, store options with session
    return DEFAULT_OPTIONS;
  }

  /**
   * Get MIME type for codec
   */
  private getMimeTypeForCodec(session: StreamingSession): string {
    const codecMimeTypes: Record<string, string> = {
      aac: 'audio/aac',
      mp3: 'audio/mpeg',
      opus: 'audio/opus',
      pcm_s16le: 'audio/wav'
    };

    return codecMimeTypes['aac'] || 'audio/aac';
  }

  /**
   * Generate temporary file path
   */
  private generateTempPath(originalPath: string, suffix: string): string {
    const dir = path.dirname(originalPath);
    const ext = path.extname(originalPath);
    const baseName = path.basename(originalPath, ext);
    return path.join(dir, `${baseName}_${suffix}${ext}`);
  }

  /**
   * Get total duration
   */
  private async getTotalDuration(sessionId: string): Promise<number> {
    const session = this.findSessionOrThrow(sessionId);
    const chunks = await this.chunkingService.getAllChunks(session.filePath);
    return chunks.length > 0 ? chunks[chunks.length - 1]!.endTime : 0;
  }
}

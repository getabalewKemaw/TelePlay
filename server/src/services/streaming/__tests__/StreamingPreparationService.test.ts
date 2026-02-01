/**
 * Streaming Preparation Service Unit Tests
 * Tests the streaming preparation service with mocked dependencies
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StreamingPreparationService } from '../StreamingPreparationService.js';
import type { IChunkingService } from '../interfaces/IChunkingService.js';
import type { ISegmentationService } from '../interfaces/ISegmentationService.js';
import type { ITranscodingService } from '../interfaces/ITranscodingService.js';
import type { ICompressionService } from '../interfaces/ICompressionService.js';
import { StreamingSessionError, StreamingPlaybackError } from '../errors/StreamingErrors.js';
import { existsSync } from 'fs';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import path from 'path';

// Mock fs
vi.mock('fs', async () => {
  const actual = await vi.importActual('fs');
  return {
    ...actual,
    existsSync: vi.fn(),
    promises: {
      ...actual.promises,
      stat: vi.fn()
    }
  };
});

describe('StreamingPreparationService', () => {
  let mockChunkingService: IChunkingService;
  let mockSegmentationService: ISegmentationService;
  let mockTranscodingService: ITranscodingService;
  let mockCompressionService: ICompressionService;
  let streamingService: StreamingPreparationService;
  let testFile: string;

  beforeEach(() => {
    testFile = path.join(tmpdir(), `streaming-test-${Date.now()}.wav`);

    mockChunkingService = {
      getAllChunks: vi.fn(),
      getChunkAtTime: vi.fn()
    };

    mockSegmentationService = {
      getAllSegments: vi.fn(),
      getChunkAtTime: vi.fn(),
      getSegmentsInRange: vi.fn()
    };

    mockTranscodingService = {
      transcodeChunk: vi.fn(),
      getRecommendedTargetCodec: vi.fn().mockReturnValue('aac')
    };

    mockCompressionService = {
      compress: vi.fn()
    };

    streamingService = new StreamingPreparationService(
      mockChunkingService,
      mockSegmentationService,
      mockTranscodingService,
      mockCompressionService
    );

    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(fs.stat).mockResolvedValue({ size: 1000000 } as any);
  });

  describe('createSession', () => {
    it('should create a streaming session', async () => {
      const session = await streamingService.createSession(testFile);

      expect(session.sessionId).toBeDefined();
      expect(session.filePath).toBe(testFile);
      expect(session.state).toBe('idle');
      expect(session.transport).toBe('http');
      expect(session.mode).toBe('file-based');
    });

    it('should create session with custom options', async () => {
      const session = await streamingService.createSession(testFile, {
        transport: 'websocket',
        mode: 'live',
        targetCodec: 'opus'
      });

      expect(session.transport).toBe('websocket');
      expect(session.mode).toBe('live');
    });

    it('should throw error if file does not exist', async () => {
      vi.mocked(existsSync).mockReturnValue(false);

      await expect(
        streamingService.createSession('/nonexistent/file.wav')
      ).rejects.toThrow();
    });
  });

  describe('prepareChunks', () => {
    it('should prepare chunks for streaming', async () => {
      const session = await streamingService.createSession(testFile);

      const mockChunks = [
        {
          index: 0,
          filePath: testFile,
          startTime: 0,
          endTime: 10,
          duration: 10
        },
        {
          index: 1,
          filePath: testFile,
          startTime: 10,
          endTime: 20,
          duration: 10
        }
      ];

      vi.mocked(mockChunkingService.getAllChunks).mockResolvedValue(mockChunks as any);
      vi.mocked(mockTranscodingService.transcodeChunk).mockResolvedValue({
        outputPath: testFile,
        originalSize: 1000000,
        transcodedSize: 500000,
        executionTime: 1000,
        sourceCodec: 'g711',
        targetCodec: 'aac',
        config: {} as any
      });

      const prepared = await streamingService.prepareChunks(session.sessionId);

      expect(prepared.length).toBe(2);
      expect(prepared[0].status).toBe('ready');
      expect(prepared[0].chunk.index).toBe(0);
    });

    it('should throw error for invalid session', async () => {
      await expect(
        streamingService.prepareChunks('invalid-session-id')
      ).rejects.toThrow(StreamingSessionError);
    });
  });

  describe('handlePlaybackControl', () => {
    it('should handle play action', async () => {
      const session = await streamingService.createSession(testFile);
      session.state = 'ready';

      const response = await streamingService.handlePlaybackControl(session.sessionId, {
        action: 'play'
      });

      expect(response.state).toBe('playing');
      expect(response.success).toBe(true);
    });

    it('should handle pause action', async () => {
      const session = await streamingService.createSession(testFile);
      session.state = 'playing';

      const response = await streamingService.handlePlaybackControl(session.sessionId, {
        action: 'pause'
      });

      expect(response.state).toBe('paused');
    });

    it('should handle seek action', async () => {
      const session = await streamingService.createSession(testFile);
      
      const mockChunks = [
        {
          index: 0,
          filePath: testFile,
          startTime: 0,
          endTime: 10,
          duration: 10
        }
      ];

      vi.mocked(mockChunkingService.getAllChunks).mockResolvedValue(mockChunks as any);
      vi.mocked(mockChunkingService.getChunkAtTime).mockResolvedValue(mockChunks[0] as any);

      const response = await streamingService.handlePlaybackControl(session.sessionId, {
        action: 'seek',
        targetTime: 5
      });

      expect(response.currentTime).toBe(5);
      expect(response.state).toBe('ready');
    });

    it('should handle fast-forward action', async () => {
      const session = await streamingService.createSession(testFile);
      session.currentTime = 10;

      const mockChunks = [
        {
          index: 0,
          filePath: testFile,
          startTime: 0,
          endTime: 30,
          duration: 30
        }
      ];

      vi.mocked(mockChunkingService.getAllChunks).mockResolvedValue(mockChunks as any);
      vi.mocked(mockChunkingService.getChunkAtTime).mockResolvedValue(mockChunks[0] as any);

      const response = await streamingService.handlePlaybackControl(session.sessionId, {
        action: 'fast-forward',
        amount: 5
      });

      expect(response.currentTime).toBe(15);
    });

    it('should handle rewind action', async () => {
      const session = await streamingService.createSession(testFile);
      session.currentTime = 10;

      const mockChunks = [
        {
          index: 0,
          filePath: testFile,
          startTime: 0,
          endTime: 30,
          duration: 30
        }
      ];

      vi.mocked(mockChunkingService.getAllChunks).mockResolvedValue(mockChunks as any);
      vi.mocked(mockChunkingService.getChunkAtTime).mockResolvedValue(mockChunks[0] as any);

      const response = await streamingService.handlePlaybackControl(session.sessionId, {
        action: 'rewind',
        amount: 5
      });

      expect(response.currentTime).toBe(5);
    });

    it('should throw error for unknown action', async () => {
      const session = await streamingService.createSession(testFile);

      await expect(
        streamingService.handlePlaybackControl(session.sessionId, {
          action: 'unknown' as any
        })
      ).rejects.toThrow(StreamingPlaybackError);
    });
  });

  describe('getStreamEndpoint', () => {
    it('should return HTTP endpoint', async () => {
      const session = await streamingService.createSession(testFile, {
        transport: 'http'
      });

      const endpoint = await streamingService.getStreamEndpoint(session.sessionId);

      expect(endpoint.protocol).toBe('http');
      expect(endpoint.url).toContain(session.sessionId);
      expect(endpoint.mimeType).toBe('audio/aac');
    });

    it('should return WebSocket endpoint', async () => {
      const session = await streamingService.createSession(testFile, {
        transport: 'websocket'
      });

      const endpoint = await streamingService.getStreamEndpoint(session.sessionId);

      expect(endpoint.protocol).toBe('websocket');
      expect(endpoint.url).toContain('ws://');
    });
  });

  describe('getStreamMetadata', () => {
    it('should return stream metadata', async () => {
      const session = await streamingService.createSession(testFile);

      const mockChunks = [
        {
          index: 0,
          filePath: testFile,
          startTime: 0,
          endTime: 30,
          duration: 30
        }
      ];

      vi.mocked(mockChunkingService.getAllChunks).mockResolvedValue(mockChunks as any);

      const metadata = await streamingService.getStreamMetadata(session.sessionId);

      expect(metadata.streamId).toBe(session.sessionId);
      expect(metadata.filePath).toBe(testFile);
      expect(metadata.duration).toBe(30);
      expect(metadata.codec).toBe('aac');
    });
  });

  describe('cleanupSession', () => {
    it('should cleanup session', async () => {
      const session = await streamingService.createSession(testFile);

      await streamingService.cleanupSession(session.sessionId);

      // Session should be removed
      await expect(
        streamingService.getStreamMetadata(session.sessionId)
      ).rejects.toThrow(StreamingSessionError);
    });
  });
});

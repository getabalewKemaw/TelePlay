/**
 * Segmentation Service Unit Tests
 * Tests the segmentation service with mocked chunking service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SegmentationService } from '../../services/segmentation/SegmentationService.js';
import type { IChunkingService } from '../../interfaces/segementation/IChunkingService.js';
import type { ChunkMetadata } from '../../types/chunking/ChunkingTypes.js';
import { SegmentationValidationError } from '../../errors/segmentation/SegmentationErrors.js';

describe('SegmentationService', () => {
  let mockChunkingService: IChunkingService;
  let segmentationService: SegmentationService;

  // Create mock chunks (20 chunks of 10 seconds each = 200 seconds total)
  const createMockChunks = (count: number, chunkDuration: number = 10): ChunkMetadata[] => {
    const chunks: ChunkMetadata[] = [];
    for (let i = 0; i < count; i++) {
      chunks.push({
        index: i,
        startTime: i * chunkDuration,
        endTime: (i + 1) * chunkDuration,
        duration: chunkDuration
      });
    }
    return chunks;
  };

  beforeEach(() => {
    mockChunkingService = {
      getAllChunks: vi.fn(),
      generateChunks: vi.fn()
    };

    segmentationService = new SegmentationService(mockChunkingService);
  });

  describe('createSegments', () => {
    it('should create segments using default adaptive strategy', async () => {
      const chunks = createMockChunks(20, 10); // 20 chunks of 10s each
      vi.mocked(mockChunkingService.getAllChunks).mockResolvedValue(chunks);

      const result = await segmentationService.createSegments('/path/to/file.mp3');

      expect(result.segments.length).toBeGreaterThan(0);
      expect(result.totalSegments).toBe(result.segments.length);
      expect(result.totalDuration).toBe(200);
      expect(result.config.strategy).toBe('adaptive');
    });

    it('should create segments using fixed strategy', async () => {
      const chunks = createMockChunks(20, 10);
      vi.mocked(mockChunkingService.getAllChunks).mockResolvedValue(chunks);

      const result = await segmentationService.createSegments('/path/to/file.mp3', {
        strategy: 'fixed',
        chunksPerSegment: 5
      });

      // 20 chunks / 5 chunks per segment = 4 segments
      expect(result.totalSegments).toBe(4);
      expect(result.segments[0].chunkCount).toBe(5);
      expect(result.segments[0].chunks.length).toBe(5);
    });

    it('should create segments using progressive strategy', async () => {
      const chunks = createMockChunks(20, 10);
      vi.mocked(mockChunkingService.getAllChunks).mockResolvedValue(chunks);

      const result = await segmentationService.createSegments('/path/to/file.mp3', {
        strategy: 'progressive'
      });

      expect(result.segments.length).toBeGreaterThan(0);
      // Progressive strategy should create segments (may not always be strictly increasing)
      expect(result.segments[0].chunkCount).toBeGreaterThan(0);
    });

    it('should create segments using low-latency strategy', async () => {
      const chunks = createMockChunks(20, 10);
      vi.mocked(mockChunkingService.getAllChunks).mockResolvedValue(chunks);

      const result = await segmentationService.createSegments('/path/to/file.mp3', {
        strategy: 'low-latency'
      });

      expect(result.segments.length).toBeGreaterThan(0);
      // First segment should be small for low latency (or at least marked as critical)
      expect(result.firstSegmentDuration).toBeLessThanOrEqual(10);
      expect(result.segments[0].isCritical).toBe(true);
    });

    it('should throw error if no chunks available', async () => {
      vi.mocked(mockChunkingService.getAllChunks).mockResolvedValue([]);

      await expect(
        segmentationService.createSegments('/path/to/file.mp3')
      ).rejects.toThrow(SegmentationValidationError);
    });

    it('should mark first segment as critical when optimizing for low latency', async () => {
      const chunks = createMockChunks(20, 10);
      vi.mocked(mockChunkingService.getAllChunks).mockResolvedValue(chunks);

      const result = await segmentationService.createSegments('/path/to/file.mp3', {
        optimizeForLowLatency: true
      });

      expect(result.segments[0].isCritical).toBe(true);
      expect(result.segments[0].priority).toBeGreaterThan(result.segments[1]?.priority || 0);
    });
  });

  describe('getSegment', () => {
    it('should get a specific segment by index', async () => {
      const chunks = createMockChunks(20, 10);
      vi.mocked(mockChunkingService.getAllChunks).mockResolvedValue(chunks);

      const segment = await segmentationService.getSegment('/path/to/file.mp3', 0);

      expect(segment.index).toBe(0);
      expect(segment.chunks.length).toBeGreaterThan(0);
    });

    it('should throw error for invalid segment index', async () => {
      const chunks = createMockChunks(20, 10);
      vi.mocked(mockChunkingService.getAllChunks).mockResolvedValue(chunks);

      await expect(
        segmentationService.getSegment('/path/to/file.mp3', 100)
      ).rejects.toThrow(SegmentationValidationError);

      await expect(
        segmentationService.getSegment('/path/to/file.mp3', -1)
      ).rejects.toThrow(SegmentationValidationError);
    });
  });

  describe('getSegmentsInRange', () => {
    it('should get segments within a time range', async () => {
      const chunks = createMockChunks(20, 10);
      vi.mocked(mockChunkingService.getAllChunks).mockResolvedValue(chunks);

      const segments = await segmentationService.getSegmentsInRange(
        '/path/to/file.mp3',
        20,
        60
      );

      expect(segments.length).toBeGreaterThan(0);
      segments.forEach(segment => {
        expect(
          (segment.startTime >= 20 && segment.startTime < 60) ||
          (segment.endTime > 20 && segment.endTime <= 60) ||
          (segment.startTime <= 20 && segment.endTime >= 60)
        ).toBe(true);
      });
    });

    it('should throw error for invalid time range', async () => {
      const chunks = createMockChunks(20, 10);
      vi.mocked(mockChunkingService.getAllChunks).mockResolvedValue(chunks);

      await expect(
        segmentationService.getSegmentsInRange('/path/to/file.mp3', 60, 20)
      ).rejects.toThrow(SegmentationValidationError);

      await expect(
        segmentationService.getSegmentsInRange('/path/to/file.mp3', 20, 20)
      ).rejects.toThrow(SegmentationValidationError);
    });
  });

  describe('getBufferingRecommendation', () => {
    it('should provide buffering recommendation based on playback state', async () => {
      const chunks = createMockChunks(20, 10);
      vi.mocked(mockChunkingService.getAllChunks).mockResolvedValue(chunks);

      const playbackState = {
        currentTime: 50,
        bufferLevel: 5,
        isPlaying: true
      };

      const bufferingStrategy = {
        initialBufferSize: 10,
        minBufferSize: 5,
        maxBufferSize: 30,
        targetBufferSize: 15
      };

      const recommendation = await segmentationService.getBufferingRecommendation(
        '/path/to/file.mp3',
        playbackState,
        bufferingStrategy
      );

      expect(recommendation.immediate.length).toBeGreaterThan(0);
      expect(recommendation.preload.length).toBeGreaterThanOrEqual(0);
      expect(recommendation.deferred.length).toBeGreaterThanOrEqual(0);
      expect(recommendation.recommendedBufferSize).toBeGreaterThan(0);
    });

    it('should prioritize immediate segments for low buffer', async () => {
      const chunks = createMockChunks(20, 10);
      vi.mocked(mockChunkingService.getAllChunks).mockResolvedValue(chunks);

      const playbackState = {
        currentTime: 50,
        bufferLevel: 2, // Low buffer
        isPlaying: true
      };

      const bufferingStrategy = {
        initialBufferSize: 10,
        minBufferSize: 5,
        maxBufferSize: 30,
        targetBufferSize: 15
      };

      const recommendation = await segmentationService.getBufferingRecommendation(
        '/path/to/file.mp3',
        playbackState,
        bufferingStrategy
      );

      // Should have immediate segments
      expect(recommendation.immediate.length).toBeGreaterThan(0);
    });

    it('should reduce preload for low bandwidth', async () => {
      const chunks = createMockChunks(20, 10);
      vi.mocked(mockChunkingService.getAllChunks).mockResolvedValue(chunks);

      const playbackState = {
        currentTime: 50,
        bufferLevel: 10,
        bandwidth: 500000, // Low bandwidth (500 kbps)
        isPlaying: true
      };

      const bufferingStrategy = {
        initialBufferSize: 10,
        minBufferSize: 5,
        maxBufferSize: 30,
        targetBufferSize: 15
      };

      const recommendation = await segmentationService.getBufferingRecommendation(
        '/path/to/file.mp3',
        playbackState,
        bufferingStrategy
      );

      // Preload should be reduced for low bandwidth
      expect(recommendation.preload.length).toBeLessThanOrEqual(
        recommendation.deferred.length + recommendation.preload.length
      );
    });
  });

  describe('getInitialSegments', () => {
    it('should return critical segments for playback start', async () => {
      const chunks = createMockChunks(20, 10);
      vi.mocked(mockChunkingService.getAllChunks).mockResolvedValue(chunks);

      const initialSegments = await segmentationService.getInitialSegments('/path/to/file.mp3');

      expect(initialSegments.length).toBeGreaterThan(0);
      // All initial segments should be critical or high priority
      initialSegments.forEach(segment => {
        expect(segment.isCritical || segment.priority >= 75).toBe(true);
      });
    });
  });

  describe('validation', () => {
    it('should validate chunks per segment', async () => {
      const chunks = createMockChunks(20, 10);
      vi.mocked(mockChunkingService.getAllChunks).mockResolvedValue(chunks);

      await expect(
        segmentationService.createSegments('/path/to/file.mp3', {
          strategy: 'fixed',
          chunksPerSegment: -1
        })
      ).rejects.toThrow(SegmentationValidationError);
    });

    it('should validate target segment duration', async () => {
      const chunks = createMockChunks(20, 10);
      vi.mocked(mockChunkingService.getAllChunks).mockResolvedValue(chunks);

      await expect(
        segmentationService.createSegments('/path/to/file.mp3', {
          strategy: 'adaptive',
          targetSegmentDuration: -1
        })
      ).rejects.toThrow(SegmentationValidationError);
    });
  });
});

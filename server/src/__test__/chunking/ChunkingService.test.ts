/**
 * Chunking Service Unit Tests
 * Tests the chunking service with mocked metadata provider
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

import { ChunkingService } from '../../services/chunking/ChunkingService.js';

import type { IMediaMetadataProvider } from '../../interfaces/chunking/IMediaMetadataProvider.js';

import type { MediaMetadata } from '../../types/chunking/ChunkingTypes.js';

import { ChunkingFileError,ChunkingSeekError,ChunkingValidationError } from '../../errors/chunking/ChunkingErrors.js';
import { existsSync } from 'fs';
import path from 'path';

// Mock fs.existsSync
vi.mock('fs', async () => {
  const actual = await vi.importActual('fs');
  return {
    ...actual,
    existsSync: vi.fn()
  };
});

describe('ChunkingService', () => {
  let mockMetadataProvider: IMediaMetadataProvider;
  let chunkingService: ChunkingService;

  beforeEach(() => {
    mockMetadataProvider = {
      getMetadata: vi.fn(),

    };

    chunkingService = new ChunkingService(mockMetadataProvider, 120);
    
    // Mock existsSync to return true by default
    vi.mocked(existsSync).mockReturnValue(true);
  });

  describe('generateChunks', () => {
    it('should generate chunks for a media file with default duration', async () => {
      const metadata: MediaMetadata = {
        duration: 300 // 5 minutes
      };

      vi.mocked(mockMetadataProvider.getMetadata).mockResolvedValue(metadata);

      const result = await chunkingService.generateChunks('/path/to/file.mp3');

      expect(result.totalChunks).toBe(3); // 300s / 120s = 2.5, ceil = 3
      expect(result.chunks.length).toBe(3);
      expect(result.totalDuration).toBe(300);
      expect(result.chunkDuration).toBe(120);

      // Check first chunk
      expect(result.chunks[0]).toEqual({
        index: 0,
        startTime: 0,
        endTime: 120,
        duration: 120
      });

      // Check last chunk (should be shorter)
      expect(result.chunks[2]).toEqual({
        index: 2,
        startTime: 240,
        endTime: 300,
        duration: 60
      });
    });

    it('should generate chunks with custom chunk duration', async () => {
      const metadata: MediaMetadata = {
        duration: 300
      };

      vi.mocked(mockMetadataProvider.getMetadata).mockResolvedValue(metadata);

      const result = await chunkingService.generateChunks('/path/to/file.mp3', {
        chunkDuration: 60 // 1 minute chunks
      });

      expect(result.totalChunks).toBe(5); // 300s / 60s = 5
      expect(result.chunkDuration).toBe(60);
      expect(result.chunks[0]!.duration).toBe(60);
    });

    it('should generate file paths when generateFiles is true', async () => {
      const metadata: MediaMetadata = {
        duration: 240 // 2 chunks
      };

      vi.mocked(mockMetadataProvider.getMetadata).mockResolvedValue(metadata);

      const result = await chunkingService.generateChunks('/path/to/file.mp3', {
        generateFiles: true,
        outputDirectory: '/output',
        baseFilename: 'test.mp3' // Include extension
      });

      // Use path.join for cross-platform compatibility
      const expectedPath0 = path.join('/output', 'test_chunk_0000.mp3');
      const expectedPath1 = path.join('/output', 'test_chunk_0001.mp3');
      expect(result.chunks[0]!.filePath).toBe(expectedPath0);
      expect(result.chunks[1]!.filePath).toBe(expectedPath1);
    });

    it('should throw error if file does not exist', async () => {
      vi.mocked(existsSync).mockReturnValue(false);

      await expect(
        chunkingService.generateChunks('/nonexistent/file.mp3')
      ).rejects.toThrow(ChunkingFileError);
    });

    it('should throw error if output directory does not exist when generateFiles is true', async () => {
      const metadata: MediaMetadata = {
        duration: 120
      };

      vi.mocked(mockMetadataProvider.getMetadata).mockResolvedValue(metadata);
      vi.mocked(existsSync).mockImplementation((path: string) => {
        return path === '/path/to/file.mp3'; // Only file exists, not directory
      });

      await expect(
        chunkingService.generateChunks('/path/to/file.mp3', {
          generateFiles: true,
          outputDirectory: '/nonexistent',
          baseFilename: 'test'
        })
      ).rejects.toThrow(ChunkingFileError);
    });

    it('should throw error for invalid chunk duration', async () => {
      const metadata: MediaMetadata = {
        duration: 300
      };

      vi.mocked(mockMetadataProvider.getMetadata).mockResolvedValue(metadata);

      await expect(
        chunkingService.generateChunks('/path/to/file.mp3', {
          chunkDuration: -10
        })
      ).rejects.toThrow(ChunkingValidationError);
    });
  });

  describe('getChunk', () => {
    it('should get a specific chunk by index', async () => {
      const metadata: MediaMetadata = {
        duration: 300
      };

      vi.mocked(mockMetadataProvider.getMetadata).mockResolvedValue(metadata);

      const chunk = await chunkingService.getChunk('/path/to/file.mp3', 1);

      expect(chunk.index).toBe(1);
      expect(chunk.startTime).toBe(120);
      expect(chunk.endTime).toBe(240);
    });

    it('should throw error for invalid chunk index', async () => {
      const metadata: MediaMetadata = {
        duration: 300
      };

      vi.mocked(mockMetadataProvider.getMetadata).mockResolvedValue(metadata);

      await expect(
        chunkingService.getChunk('/path/to/file.mp3', 10)
      ).rejects.toThrow(ChunkingValidationError);

      await expect(
        chunkingService.getChunk('/path/to/file.mp3', -1)
      ).rejects.toThrow(ChunkingValidationError);
    });
  });

  describe('seek', () => {
    it('should find chunk at a specific time', async () => {
      const metadata: MediaMetadata = {
        duration: 300
      };

      vi.mocked(mockMetadataProvider.getMetadata).mockResolvedValue(metadata);

      const result = await chunkingService.seek('/path/to/file.mp3', { time: 150 });

      expect(result.chunk.index).toBe(1);
      expect(result.chunk.startTime).toBe(120);
      expect(result.chunk.endTime).toBe(240);
      expect(result.offsetInChunk).toBe(30); // 150 - 120
      expect(result.exact).toBe(true);
    });

    it('should find nearest chunk when exact is false', async () => {
      const metadata: MediaMetadata = {
        duration: 300
      };

      vi.mocked(mockMetadataProvider.getMetadata).mockResolvedValue(metadata);

      const result = await chunkingService.seek('/path/to/file.mp3', {
        time: 300,
        exact: false
      });

      expect(result.chunk.index).toBe(2); // Last chunk
      // 300 is at the end time (exclusive), so it's not exact
      expect(result.exact).toBe(false);
    });

    it('should throw error for time out of range', async () => {
      const metadata: MediaMetadata = {
        duration: 300
      };

      vi.mocked(mockMetadataProvider.getMetadata).mockResolvedValue(metadata);

      await expect(
        chunkingService.seek('/path/to/file.mp3', { time: 500 })
      ).rejects.toThrow(ChunkingSeekError);

      await expect(
        chunkingService.seek('/path/to/file.mp3', { time: -10 })
      ).rejects.toThrow(ChunkingSeekError);
    });
  });

  describe('getChunkAtTime', () => {
    it('should get chunk containing a specific time', async () => {
      const metadata: MediaMetadata = {
        duration: 300
      };

      vi.mocked(mockMetadataProvider.getMetadata).mockResolvedValue(metadata);

      const chunk = await chunkingService.getChunkAtTime('/path/to/file.mp3', 180);

      expect(chunk.index).toBe(1);
      expect(chunk.startTime).toBe(120);
      expect(chunk.endTime).toBe(240);
    });
  });

  describe('getChunksInRange', () => {
    it('should get chunks within a time range', async () => {
      const metadata: MediaMetadata = {
        duration: 300
      };

      vi.mocked(mockMetadataProvider.getMetadata).mockResolvedValue(metadata);

      const chunks = await chunkingService.getChunksInRange(
        '/path/to/file.mp3',
        100,
        250
      );

      // Range 100-250 overlaps with chunks 0 (0-120), 1 (120-240), and 2 (240-300)
      // Chunk 0: 0-120 (overlaps with 100-120)
      // Chunk 1: 120-240 (overlaps with 120-240)
      // Chunk 2: 240-300 (overlaps with 240-250)
      expect(chunks.length).toBe(3);
      expect(chunks[0].index).toBe(0);
      expect(chunks[1].index).toBe(1);
      expect(chunks[2].index).toBe(2);
    });

    it('should throw error for invalid time range', async () => {
      const metadata: MediaMetadata = {
        duration: 300
      };

      vi.mocked(mockMetadataProvider.getMetadata).mockResolvedValue(metadata);

      await expect(
        chunkingService.getChunksInRange('/path/to/file.mp3', 250, 100)
      ).rejects.toThrow(ChunkingValidationError);

      await expect(
        chunkingService.getChunksInRange('/path/to/file.mp3', 100, 100)
      ).rejects.toThrow(ChunkingValidationError);
    });
  });

  describe('chunking algorithm', () => {
    it('should handle exact duration matches', async () => {
      const metadata: MediaMetadata = {
        duration: 240 // Exactly 2 chunks of 120s
      };

      vi.mocked(mockMetadataProvider.getMetadata).mockResolvedValue(metadata);

      const result = await chunkingService.generateChunks('/path/to/file.mp3');

      expect(result.totalChunks).toBe(2);
      expect(result.chunks[0].duration).toBe(120);
      expect(result.chunks[1].duration).toBe(120);
    });

    it('should handle very short files', async () => {
      const metadata: MediaMetadata = {
        duration: 30 // Less than one chunk
      };

      vi.mocked(mockMetadataProvider.getMetadata).mockResolvedValue(metadata);

      const result = await chunkingService.generateChunks('/path/to/file.mp3');

      expect(result.totalChunks).toBe(1);
      expect(result.chunks[0].duration).toBe(30);
      expect(result.lastChunkDuration).toBe(30);
    });

    it('should handle very long files', async () => {
      const metadata: MediaMetadata = {
        duration: 3600 // 1 hour
      };

      vi.mocked(mockMetadataProvider.getMetadata).mockResolvedValue(metadata);

      const result = await chunkingService.generateChunks('/path/to/file.mp3');

      expect(result.totalChunks).toBe(30); // 3600s / 120s = 30
      expect(result.chunks[29].duration).toBe(120);
    });
  });
});

/**
 * FFprobe Metadata Provider Unit Tests
 * Tests the FFprobe metadata provider with mocked FFprobe
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FFprobeMetadataProvider } from '../../services/chunking/implementations/FFprobeMetadataProvider.js';
import { ChunkingMetadataError } from '../../errors/chunking/ChunkingErrors.js';
import { spawn } from 'child_process';

// Mock child_process
vi.mock('child_process', () => {
  return {
    spawn: vi.fn()
  };
});

describe('FFprobeMetadataProvider', () => {
  let provider: FFprobeMetadataProvider;
  let mockProcess: any;

  beforeEach(() => {
    provider = new FFprobeMetadataProvider('ffprobe');
    mockProcess = {
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      on: vi.fn()
    };
    vi.mocked(spawn).mockReturnValue(mockProcess as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getMetadata', () => {
    it('should parse FFprobe JSON output correctly', async () => {
      const ffprobeOutput = JSON.stringify({
        format: {
          duration: '300.5',
          size: '5000000',
          bit_rate: '128000',
          format_name: 'mp3'
        },
        streams: [
          {
            codec_name: 'mp3'
          }
        ]
      });

      let stdoutHandler: ((data: Buffer) => void) | undefined;
      let closeHandler: ((code: number) => void) | undefined;

      mockProcess.stdout.on.mockImplementation((event: string, handler: any) => {
        if (event === 'data') {
          stdoutHandler = handler;
        }
      });

      mockProcess.on.mockImplementation((event: string, handler: any) => {
        if (event === 'close') {
          closeHandler = handler;
        }
      });

      const metadataPromise = provider.getMetadata('/path/to/file.mp3');

      // Simulate data arrival first
      if (stdoutHandler) {
        stdoutHandler(Buffer.from(ffprobeOutput));
      }

      // Then close
      if (closeHandler) {
        setTimeout(() => closeHandler(0), 10);
      }

      const metadata = await metadataPromise;

      expect(metadata.duration).toBe(300.5);
      expect(metadata.fileSize).toBe(5000000);
      expect(metadata.bitrate).toBe(128000);
      expect(metadata.format).toBe('mp3');
      expect(metadata.codec).toBe('mp3');
    });

    it('should handle missing optional fields', async () => {
      const ffprobeOutput = JSON.stringify({
        format: {
          duration: '120.0'
        },
        streams: []
      });

      let stdoutHandler: ((data: Buffer) => void) | undefined;
      let closeHandler: ((code: number) => void) | undefined;

      mockProcess.stdout.on.mockImplementation((event: string, handler: any) => {
        if (event === 'data') {
          stdoutHandler = handler;
        }
      });

      mockProcess.on.mockImplementation((event: string, handler: any) => {
        if (event === 'close') {
          closeHandler = handler;
        }
      });

      const metadataPromise = provider.getMetadata('/path/to/file.mp3');

      // Simulate data arrival first
      if (stdoutHandler) {
        stdoutHandler(Buffer.from(ffprobeOutput));
      }

      // Then close
      if (closeHandler) {
        setTimeout(() => closeHandler(0), 10);
      }

      const metadata = await metadataPromise;

      expect(metadata.duration).toBe(120.0);
      expect(metadata.fileSize).toBeUndefined();
      expect(metadata.bitrate).toBeUndefined();
    });

    it('should throw error on invalid duration', async () => {
      const ffprobeOutput = JSON.stringify({
        format: {
          duration: 'invalid'
        }
      });

      mockProcess.on.mockImplementation((event: string, handler: any) => {
        if (event === 'close') {
          setTimeout(() => handler(0), 10);
        }
      });

      const stdoutHandler = mockProcess.stdout.on.mock.calls.find(([event]) => event === 'data')?.[1];
      if (stdoutHandler) {
        stdoutHandler(Buffer.from(ffprobeOutput));
      }

      await expect(
        provider.getMetadata('/path/to/file.mp3')
      ).rejects.toThrow(ChunkingMetadataError);
    });

    it('should throw error on FFprobe failure', async () => {
      mockProcess.on.mockImplementation((event: string, handler: any) => {
        if (event === 'close') {
          setTimeout(() => handler(1), 10);
        }
      });

      const stderrHandler = mockProcess.stderr.on.mock.calls.find(([event]) => event === 'data')?.[1];
      if (stderrHandler) {
        stderrHandler(Buffer.from('FFprobe error'));
      }

      await expect(
        provider.getMetadata('/path/to/file.mp3')
      ).rejects.toThrow(ChunkingMetadataError);
    });

    it('should throw error on spawn failure', async () => {
      mockProcess.on.mockImplementation((event: string, handler: any) => {
        if (event === 'error') {
          setTimeout(() => handler(new Error('Spawn failed')), 10);
        }
      });

      await expect(
        provider.getMetadata('/path/to/file.mp3')
      ).rejects.toThrow(ChunkingMetadataError);
    });
  });

  describe('isAvailable', () => {
    it('should return true when FFprobe is available', async () => {
      mockProcess.on.mockImplementation((event: string, handler: any) => {
        if (event === 'close') {
          setTimeout(() => handler(0), 10);
        }
      });

      const available = await provider.isAvailable();
      expect(available).toBe(true);
    });

    it('should return false when FFprobe is not available', async () => {
      mockProcess.on.mockImplementation((event: string, handler: any) => {
        if (event === 'error') {
          setTimeout(() => handler(new Error('Command not found')), 10);
        }
      });

      const available = await provider.isAvailable();
      expect(available).toBe(false);
    });
  });
});

/**
 * FFmpeg Service Unit Tests
 * Tests the main FFmpeg service with mocked executor
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createFFmpegService, type FFmpegService } from '../../services/ffmpeg/FFmpegService.js';
import type { IFfmpegExecutor } from '../../interfaces/ffmpeg/IFfmpegExecutor.js';
import type { FFmpegExecutionResult } from '../../types/ffmpeg/FFmpegTypes.js';
import { createFFmpegExecutionError } from '../../errors/ffmpeg/FFmpegErrors.js';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import path from 'path';

describe('FFmpegService', () => {
  let mockExecutor: IFfmpegExecutor;
  let service: FFmpegService;
  let testInputFile: string;
  let testOutputFile: string;

  beforeEach(async () => {
    // Create test files
    testInputFile = path.join(tmpdir(), `test-input-${Date.now()}.wav`);
    testOutputFile = path.join(tmpdir(), `test-output-${Date.now()}.mp3`);
    
    await fs.writeFile(testInputFile, 'test audio content');

    // Create mock executor
    mockExecutor = {
      execute: vi.fn(),
      isAvailable: vi.fn(),
      getVersion: vi.fn()
    };

    service = createFFmpegService(mockExecutor);
  });

  describe('decode', () => {
    it('should successfully decode audio file', async () => {
      const mockResult: FFmpegExecutionResult = {
        success: true,
        executionTime: 1000,
        exitCode: 0,
        stderr: '',
        outputPath: testOutputFile
      };

      vi.mocked(mockExecutor.execute).mockResolvedValue(mockResult);

      const result = await service.decode({
        input: { path: testInputFile },
        output: { path: testOutputFile }
      });

      expect(result.success).toBe(true);
      expect(mockExecutor.execute).toHaveBeenCalled();
    });

    it('should validate input file exists', async () => {
      const nonExistentFile = path.join(tmpdir(), `non-existent-${Date.now()}.wav`);

      await expect(
        service.decode({
          input: { path: nonExistentFile },
          output: { path: testOutputFile }
        })
      ).rejects.toMatchObject({ name: 'FFmpegValidationError' });
    });

    it('should validate output directory exists', async () => {
      const invalidOutput = path.join('/non/existent/dir', 'output.mp3');

      await expect(
        service.decode({
          input: { path: testInputFile },
          output: { path: invalidOutput }
        })
      ).rejects.toMatchObject({ name: 'FFmpegValidationError' });
    });

    it('should validate codec if provided', async () => {
      await expect(
        service.decode({
          input: { path: testInputFile },
          output: { path: testOutputFile },
          codec: 'invalid' as any
        })
      ).rejects.toMatchObject({ name: 'FFmpegValidationError' });
    });
  });

  describe('encode', () => {
    it('should successfully encode audio file', async () => {
      const mockResult: FFmpegExecutionResult = {
        success: true,
        executionTime: 1500,
        exitCode: 0,
        stderr: '',
        outputPath: testOutputFile
      };

      vi.mocked(mockExecutor.execute).mockResolvedValue(mockResult);

      const result = await service.encode({
        input: { path: testInputFile },
        output: { path: testOutputFile },
        encoding: {
          codec: 'aac',
          sampleRate: 44100,
          channels: 2,
          bitrate: 128
        }
      });

      expect(result.success).toBe(true);
      expect(mockExecutor.execute).toHaveBeenCalled();
    });

    it('should validate encoding parameters', async () => {
      await expect(
        service.encode({
          input: { path: testInputFile },
          output: { path: testOutputFile },
          encoding: {
            codec: 'invalid' as any,
            sampleRate: 44100,
            channels: 2
          }
        })
      ).rejects.toMatchObject({ name: 'FFmpegValidationError' });
    });

    it('should validate sample rate', async () => {
      await expect(
        service.encode({
          input: { path: testInputFile },
          output: { path: testOutputFile },
          encoding: {
            codec: 'aac',
            sampleRate: 11025 as any,
            channels: 2
          }
        })
      ).rejects.toMatchObject({ name: 'FFmpegValidationError' });
    });

    it('should validate channels', async () => {
      await expect(
        service.encode({
          input: { path: testInputFile },
          output: { path: testOutputFile },
          encoding: {
            codec: 'aac',
            sampleRate: 44100,
            channels: 5 as any
          }
        })
      ).rejects.toMatchObject({ name: 'FFmpegValidationError' });
    });
  });

  describe('transcode', () => {
    it('should successfully transcode audio file', async () => {
      const mockResult: FFmpegExecutionResult = {
        success: true,
        executionTime: 2000,
        exitCode: 0,
        stderr: '',
        outputPath: testOutputFile
      };

      vi.mocked(mockExecutor.execute).mockResolvedValue(mockResult);

      const result = await service.transcode({
        input: { path: testInputFile },
        output: { path: testOutputFile },
        sourceEncoding: {
          codec: 'g711',
          sampleRate: 8000,
          channels: 1
        },
        targetEncoding: {
          codec: 'aac',
          sampleRate: 44100,
          channels: 2
        }
      });

      expect(result.success).toBe(true);
      expect(mockExecutor.execute).toHaveBeenCalled();
    });

    it('should validate both source and target encodings', async () => {
      await expect(
        service.transcode({
          input: { path: testInputFile },
          output: { path: testOutputFile },
          sourceEncoding: {
            codec: 'invalid' as any,
            sampleRate: 8000,
            channels: 1
          },
          targetEncoding: {
            codec: 'aac',
            sampleRate: 44100,
            channels: 2
          }
        })
      ).rejects.toMatchObject({ name: 'FFmpegValidationError' });
    });
  });

  describe('convert', () => {
    it('should successfully convert audio format', async () => {
      const mockResult: FFmpegExecutionResult = {
        success: true,
        executionTime: 1200,
        exitCode: 0,
        stderr: '',
        outputPath: testOutputFile
      };

      vi.mocked(mockExecutor.execute).mockResolvedValue(mockResult);

      const result = await service.convert({
        input: { path: testInputFile },
        output: { path: testOutputFile },
        targetFormat: 'mp3'
      });

      expect(result.success).toBe(true);
      expect(mockExecutor.execute).toHaveBeenCalled();
    });

    it('should accept optional encoding parameters', async () => {
      const mockResult: FFmpegExecutionResult = {
        success: true,
        executionTime: 1200,
        exitCode: 0,
        stderr: '',
        outputPath: testOutputFile
      };

      vi.mocked(mockExecutor.execute).mockResolvedValue(mockResult);

      const result = await service.convert({
        input: { path: testInputFile },
        output: { path: testOutputFile },
        targetFormat: 'mp3',
        encoding: {
          codec: 'mp3',
          sampleRate: 44100,
          channels: 2
        }
      });

      expect(result.success).toBe(true);
    });
  });

  describe('isAvailable', () => {
    it('should delegate to executor', async () => {
      vi.mocked(mockExecutor.isAvailable).mockResolvedValue(true);

      const available = await service.isAvailable();
      expect(available).toBe(true);
      expect(mockExecutor.isAvailable).toHaveBeenCalled();
    });
  });

  describe('getVersion', () => {
    it('should delegate to executor', async () => {
      vi.mocked(mockExecutor.getVersion).mockResolvedValue('ffmpeg version 4.4.0');

      const version = await service.getVersion();
      expect(version).toBe('ffmpeg version 4.4.0');
      expect(mockExecutor.getVersion).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should propagate execution errors', async () => {
      const executionError = createFFmpegExecutionError(
        'FFmpeg failed',
        1,
        'Error message',
        1000
      );

      vi.mocked(mockExecutor.execute).mockRejectedValue(executionError);

      await expect(
        service.decode({
          input: { path: testInputFile },
          output: { path: testOutputFile }
        })
      ).rejects.toMatchObject({ name: 'FFmpegExecutionError' });
    });
  });
});

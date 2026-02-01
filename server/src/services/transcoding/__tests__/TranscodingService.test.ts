/**
 * Transcoding Service Unit Tests
 * Tests the transcoding service with mocked FFmpeg service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TranscodingService } from '../TranscodingService.js';
import type { IFfmpegService } from '../interfaces/IFfmpegService.js';
import type { FFmpegExecutionResult } from '../../../ffmpeg/types/FFmpegTypes.js';
import { TranscodingValidationError, TranscodingCodecError, TranscodingFileError } from '../errors/TranscodingErrors.js';
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

describe('TranscodingService', () => {
  let mockFFmpegService: IFfmpegService;
  let transcodingService: TranscodingService;
  let testInputFile: string;
  let testOutputFile: string;
  let testDir: string;

  beforeEach(() => {
    testDir = path.join(tmpdir(), `transcoding-test-${Date.now()}`);
    testInputFile = path.join(testDir, 'input.g711');
    testOutputFile = path.join(testDir, 'output.aac');

    mockFFmpegService = {
      transcode: vi.fn(),
      isAvailable: vi.fn().mockResolvedValue(true)
    };

    transcodingService = new TranscodingService(mockFFmpegService);

    // Mock file system
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(fs.stat).mockImplementation(async (filePath: string) => {
      if (filePath === testInputFile) {
        return { size: 1000000 } as any; // 1MB
      }
      if (filePath === testOutputFile || filePath.includes('_aac')) {
        return { size: 500000 } as any; // 500KB
      }
      return { size: 0 } as any;
    });
  });

  describe('transcode', () => {
    it('should transcode G.711 to AAC', async () => {
      const mockResult: FFmpegExecutionResult = {
        success: true,
        executionTime: 2000,
        exitCode: 0,
        stderr: '',
        outputPath: testOutputFile
      };

      vi.mocked(mockFFmpegService.transcode).mockResolvedValue(mockResult);

      const result = await transcodingService.transcode(testInputFile, {
        sourceCodec: 'g711',
        targetCodec: 'aac'
      });

      expect(result.sourceCodec).toBe('g711');
      expect(result.targetCodec).toBe('aac');
      expect(result.originalSize).toBe(1000000);
      expect(result.transcodedSize).toBe(500000);
      expect(mockFFmpegService.transcode).toHaveBeenCalled();
    });

    it('should transcode G.726 with bitrate', async () => {
      const mockResult: FFmpegExecutionResult = {
        success: true,
        executionTime: 2000,
        exitCode: 0,
        stderr: '',
        outputPath: testOutputFile
      };

      vi.mocked(mockFFmpegService.transcode).mockResolvedValue(mockResult);

      const result = await transcodingService.transcode(testInputFile, {
        sourceCodec: 'g726',
        sourceBitrate: 32,
        targetCodec: 'aac'
      });

      expect(result.sourceCodec).toBe('g726');
      expect(result.config.source.bitrate).toBe(32);
    });

    it('should throw error if input file does not exist', async () => {
      vi.mocked(existsSync).mockReturnValue(false);

      await expect(
        transcodingService.transcode('/nonexistent/file.g711')
      ).rejects.toThrow(TranscodingFileError);
    });

    it('should throw error for G.726 without bitrate', async () => {
      await expect(
        transcodingService.transcode(testInputFile, {
          sourceCodec: 'g726',
          targetCodec: 'aac'
        })
      ).rejects.toThrow(TranscodingValidationError);
    });

    it('should use recommended target codec if not specified', async () => {
      const mockResult: FFmpegExecutionResult = {
        success: true,
        executionTime: 2000,
        exitCode: 0,
        stderr: '',
        outputPath: testOutputFile
      };

      vi.mocked(mockFFmpegService.transcode).mockResolvedValue(mockResult);

      const result = await transcodingService.transcode(testInputFile, {
        sourceCodec: 'g711'
      });

      expect(result.targetCodec).toBe('aac'); // Recommended for G.711
    });
  });

  describe('transcodeChunk', () => {
    it('should transcode a chunk', async () => {
      const mockResult: FFmpegExecutionResult = {
        success: true,
        executionTime: 1000,
        exitCode: 0,
        stderr: '',
        outputPath: testOutputFile
      };

      vi.mocked(mockFFmpegService.transcode).mockResolvedValue(mockResult);

      const result = await transcodingService.transcodeChunk({
        inputPath: testInputFile,
        outputPath: testOutputFile,
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

      expect(result.sourceCodec).toBe('g711');
      expect(result.targetCodec).toBe('aac');
      expect(result.config.mode).toBe('chunk');
    });
  });

  describe('transcodeForStreaming', () => {
    it('should transcode for streaming with time range', async () => {
      const mockResult: FFmpegExecutionResult = {
        success: true,
        executionTime: 1000,
        exitCode: 0,
        stderr: '',
        outputPath: testOutputFile
      };

      vi.mocked(mockFFmpegService.transcode).mockResolvedValue(mockResult);

      const result = await transcodingService.transcodeForStreaming(
        testInputFile,
        10, // start time
        30, // duration
        {
          sourceCodec: 'g711',
          targetCodec: 'aac'
        }
      );

      expect(result.config.mode).toBe('stream');
      expect(result.config.startTime).toBe(10);
      expect(result.config.duration).toBe(30);
    });

    it('should throw error for invalid start time', async () => {
      await expect(
        transcodingService.transcodeForStreaming(
          testInputFile,
          -1, // invalid
          30,
          {}
        )
      ).rejects.toThrow(TranscodingValidationError);
    });

    it('should throw error for invalid duration', async () => {
      await expect(
        transcodingService.transcodeForStreaming(
          testInputFile,
          10,
          0, // invalid
          {}
        )
      ).rejects.toThrow(TranscodingValidationError);
    });
  });

  describe('getRecommendedTargetCodec', () => {
    it('should return recommended codec for G.711', () => {
      const codec = transcodingService.getRecommendedTargetCodec('g711');
      expect(codec).toBe('aac');
    });

    it('should return recommended codec for G.726', () => {
      const codec = transcodingService.getRecommendedTargetCodec('g726');
      expect(codec).toBe('aac');
    });

    it('should return default for unknown codec', () => {
      const codec = transcodingService.getRecommendedTargetCodec('unknown');
      expect(codec).toBe('aac');
    });
  });

  describe('isTranscodingNeeded', () => {
    it('should return true for different codecs', async () => {
      const needed = await transcodingService.isTranscodingNeeded(
        testInputFile,
        'aac'
      );
      expect(needed).toBe(true);
    });
  });
});

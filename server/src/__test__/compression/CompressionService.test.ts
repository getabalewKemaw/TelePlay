/**
 * Compression Service Unit Tests
 * Tests the compression service with mocked FFmpeg service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CompressionService } from '../CompressionService.js';
import type { IFfmpegService } from '../interfaces/IFfmpegService.js';
import type { FFmpegExecutionResult } from '../../../ffmpeg/types/FFmpegTypes.js';
import { CompressionValidationError, CompressionPresetError } from '../errors/CompressionErrors.js';
import { existsSync } from 'fs';
import { promises as fs } from 'fs';
import path from 'path';
import { tmpdir } from 'os';

// Mock fs
vi.mock('fs', async () => {
  const actual = await vi.importActual('fs');
  return {
    ...actual,
    existsSync: vi.fn(),
    promises: {
      ...actual.promises,
      stat: vi.fn(),
      access: vi.fn()
    }
  };
});

describe('CompressionService', () => {
  let mockFFmpegService: IFfmpegService;
  let compressionService: CompressionService;
  let testInputFile: string;
  let testOutputFile: string;
  let testDir: string;
  let fileSizes: Map<string, number>;

  beforeEach(() => {
    testDir = path.join(tmpdir(), `compression-test-${Date.now()}`);
    testInputFile = path.join(testDir, 'input.wav');
    testOutputFile = path.join(testDir, 'output.aac');
    fileSizes = new Map<string, number>();

    mockFFmpegService = {
      encode: vi.fn(),
      isAvailable: vi.fn().mockResolvedValue(true)
    };

    compressionService = new CompressionService(mockFFmpegService);

    // Mock file system
    vi.mocked(existsSync).mockReturnValue(true);
    fileSizes.set(testInputFile, 1000000); // 1MB default
    
    vi.mocked(fs.stat).mockImplementation(async (filePath: string) => {
      const size = fileSizes.get(filePath) || 500000; // Default to 500KB for output
      return { size } as any;
    });
    vi.mocked(fs.access).mockResolvedValue(undefined);
  });

  describe('compress', () => {
    it('should compress a file with default settings', async () => {
      const mockResult: FFmpegExecutionResult = {
        success: true,
        executionTime: 1000,
        exitCode: 0,
        stderr: '',
        outputPath: testOutputFile
      };

      vi.mocked(mockFFmpegService.encode).mockResolvedValue(mockResult);

      // Set output file size in the map
      const outputPath = path.join(path.dirname(testInputFile), 'input_compressed_medium_aac.wav');
      fileSizes.set(outputPath, 500000);

      const result = await compressionService.compress(testInputFile);

      expect(result.originalSize).toBe(1000000);
      expect(result.compressedSize).toBe(500000);
      expect(result.compressionRatio).toBe(0.5);
      expect(result.compressionPercentage).toBe(50);
      expect(result.bandwidthSavings).toBe(500000);
      expect(mockFFmpegService.encode).toHaveBeenCalled();
    });

    it('should compress with custom level and strategy', async () => {
      const mockResult: FFmpegExecutionResult = {
        success: true,
        executionTime: 2000,
        exitCode: 0,
        stderr: '',
        outputPath: testOutputFile
      };

      vi.mocked(mockFFmpegService.encode).mockResolvedValue(mockResult);

      const result = await compressionService.compress(testInputFile, {
        level: 'high',
        strategy: 'size',
        targetBitrate: 64
      });

      expect(result.config.level).toBe('high');
      expect(result.config.strategy).toBe('size');
      expect(result.config.targetBitrate).toBe(64);
    });

    it('should throw error if input file does not exist', async () => {
      vi.mocked(existsSync).mockReturnValue(false);

      await expect(
        compressionService.compress('/nonexistent/file.wav')
      ).rejects.toThrow(CompressionValidationError);
    });

    it('should throw error for invalid compression level', async () => {
      await expect(
        compressionService.compress(testInputFile, {
          level: 'invalid' as any
        })
      ).rejects.toThrow(CompressionValidationError);
    });

    it('should throw error for invalid compression strategy', async () => {
      await expect(
        compressionService.compress(testInputFile, {
          strategy: 'invalid' as any
        })
      ).rejects.toThrow(CompressionValidationError);
    });

    it('should throw error for invalid bitrate', async () => {
      await expect(
        compressionService.compress(testInputFile, {
          targetBitrate: -10
        })
      ).rejects.toThrow(CompressionValidationError);

      await expect(
        compressionService.compress(testInputFile, {
          targetBitrate: 2000
        })
      ).rejects.toThrow(CompressionValidationError);
    });

    it('should use custom output path if provided', async () => {
      const customOutput = path.join(testDir, 'custom_output.aac');
      const mockResult: FFmpegExecutionResult = {
        success: true,
        executionTime: 1000,
        exitCode: 0,
        stderr: '',
        outputPath: customOutput
      };

      vi.mocked(mockFFmpegService.encode).mockResolvedValue(mockResult);
      vi.mocked(fs.stat).mockImplementation(async (filePath: string) => {
        if (filePath === customOutput) {
          return { size: 500000 } as any;
        }
        return { size: 1000000 } as any;
      });

      const result = await compressionService.compress(testInputFile, {
        outputPath: customOutput
      });

      expect(result.outputPath).toBe(customOutput);
    });
  });

  describe('getRecommendation', () => {
    it('should recommend compression settings for large file', async () => {
      fileSizes.set(testInputFile, 200 * 1024 * 1024); // 200MB

      const recommendation = await compressionService.getRecommendation(testInputFile);

      expect(recommendation.recommendedLevel).toBe('high');
      expect(recommendation.recommendedStrategy).toBe('size');
      expect(recommendation.expectedRatio).toBeLessThan(0.5);
    });

    it('should recommend compression settings for small file', async () => {
      fileSizes.set(testInputFile, 5 * 1024 * 1024); // 5MB

      const recommendation = await compressionService.getRecommendation(testInputFile);

      expect(recommendation.recommendedLevel).toBe('low');
      expect(recommendation.recommendedStrategy).toBe('quality');
      expect(recommendation.expectedRatio).toBeGreaterThan(0.7);
    });

    it('should recommend based on target size', async () => {
      fileSizes.set(testInputFile, 100 * 1024 * 1024); // 100MB
      const targetSize = 20 * 1024 * 1024; // 20MB target

      const recommendation = await compressionService.getRecommendation(testInputFile, targetSize);

      expect(recommendation.expectedRatio).toBeLessThan(0.3);
      expect(recommendation.recommendedLevel).toBe('maximum');
    });

    it('should detect already compressed files', async () => {
      const compressedFile = path.join(testDir, 'input.mp3');
      fileSizes.set(compressedFile, 10 * 1024 * 1024);

      const recommendation = await compressionService.getRecommendation(compressedFile);

      expect(recommendation.recommendedLevel).toBe('low');
      expect(recommendation.expectedRatio).toBeGreaterThan(0.8);
    });
  });

  describe('getPresets', () => {
    it('should return all available presets', () => {
      const presets = compressionService.getPresets();

      expect(presets.length).toBeGreaterThan(0);
      expect(presets.some(p => p.name === 'balanced')).toBe(true);
      expect(presets.some(p => p.name === 'fast')).toBe(true);
      expect(presets.some(p => p.name === 'small')).toBe(true);
    });
  });

  describe('compressWithPreset', () => {
    it('should compress using a preset', async () => {
      const mockResult: FFmpegExecutionResult = {
        success: true,
        executionTime: 1000,
        exitCode: 0,
        stderr: '',
        outputPath: testOutputFile
      };

      vi.mocked(mockFFmpegService.encode).mockResolvedValue(mockResult);

      const result = await compressionService.compressWithPreset(
        testInputFile,
        'balanced'
      );

      expect(result.config.level).toBe('medium');
      expect(result.config.strategy).toBe('balanced');
      expect(result.config.targetBitrate).toBe(96);
    });

    it('should throw error for unknown preset', async () => {
      await expect(
        compressionService.compressWithPreset(testInputFile, 'unknown')
      ).rejects.toThrow(CompressionPresetError);
    });

    it('should allow overriding preset options', async () => {
      const mockResult: FFmpegExecutionResult = {
        success: true,
        executionTime: 1000,
        exitCode: 0,
        stderr: '',
        outputPath: testOutputFile
      };

      vi.mocked(mockFFmpegService.encode).mockResolvedValue(mockResult);

      const result = await compressionService.compressWithPreset(
        testInputFile,
        'balanced',
        {
          targetBitrate: 128 // Override preset bitrate
        }
      );

      expect(result.config.targetBitrate).toBe(128);
    });
  });

  describe('estimateCompression', () => {
    it('should estimate compression metrics', async () => {
      fileSizes.set(testInputFile, 10 * 1024 * 1024); // 10MB

      const metrics = await compressionService.estimateCompression(testInputFile, {
        level: 'medium',
        strategy: 'balanced'
      });

      expect(metrics.compressionRatio).toBeGreaterThan(0);
      expect(metrics.compressionRatio).toBeLessThan(1);
      expect(metrics.compressionSpeed).toBeGreaterThan(0);
      expect(metrics.compressionTime).toBeGreaterThan(0);
    });

    it('should estimate different ratios for different levels', async () => {
      fileSizes.set(testInputFile, 10 * 1024 * 1024);

      const lowMetrics = await compressionService.estimateCompression(testInputFile, {
        level: 'low',
        strategy: 'balanced'
      });

      const highMetrics = await compressionService.estimateCompression(testInputFile, {
        level: 'high',
        strategy: 'balanced'
      });

      // High compression should have lower ratio (more compression)
      expect(highMetrics.compressionRatio).toBeLessThan(lowMetrics.compressionRatio);
    });
  });

  describe('compression metrics', () => {
    it('should calculate compression ratio correctly', async () => {
      const mockResult: FFmpegExecutionResult = {
        success: true,
        executionTime: 1000,
        exitCode: 0,
        stderr: '',
        outputPath: testOutputFile
      };

      vi.mocked(mockFFmpegService.encode).mockResolvedValue(mockResult);
      const outputPath = path.join(path.dirname(testInputFile), 'input_compressed_medium_aac.wav');
      fileSizes.set(testInputFile, 1000000);
      fileSizes.set(outputPath, 300000);

      const result = await compressionService.compress(testInputFile);

      expect(result.compressionRatio).toBe(0.3); // 300KB / 1MB
      expect(result.compressionPercentage).toBe(70); // 70% reduction
      expect(result.bandwidthSavings).toBe(700000); // 700KB saved
    });
  });
});

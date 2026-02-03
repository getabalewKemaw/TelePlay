/**
 * FFmpeg Validator Unit Tests
 */

import { describe, it, expect } from 'vitest';
import { FFmpegValidator } from '../../validator/ffmpeg/FFmpegValidator.js';
import { FFmpegValidationError } from '../../errors/ffmpeg/FFmpegErrors.js';
import { promises as fs } from 'fs';
import { existsSync } from 'fs';
import path from 'path';
import { tmpdir } from 'os';

describe('FFmpegValidator', () => {
  describe('validateCodec', () => {
    it('should accept valid codecs', () => {
      const validCodecs = ['g711', 'g726', 'g728', 'pcm_s16le', 'pcm_s24le', 'aac', 'mp3', 'opus'];
    
      validCodecs.forEach(codec => {
        expect(() => FFmpegValidator.validateCodec(codec)).not.toThrow();
      });
    });

    it('should reject invalid codecs', () => {
      const invalidCodecs = ['invalid', 'h264', 'vp9', ''];

      invalidCodecs.forEach(codec => {
        expect(() => FFmpegValidator.validateCodec(codec)).toThrow(FFmpegValidationError);
      });
    });

    it('should throw error with correct message and field', () => {
      try {
        FFmpegValidator.validateCodec('invalid');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(FFmpegValidationError);
        if (error instanceof FFmpegValidationError) {
          expect(error.field).toBe('codec');
          expect(error.message).toContain('Unsupported codec');
        }
      }
    });
  });

  describe('validateSampleRate', () => {
    it('should accept valid sample rates', () => {
      const validRates = [8000, 16000, 22050, 44100, 48000];
      
      validRates.forEach(rate => {
        expect(() => FFmpegValidator.validateSampleRate(rate)).not.toThrow();
      });
    });

    it('should reject invalid sample rates', () => {
      const invalidRates = [11025, 32000, 96000, 0, -1];

      invalidRates.forEach(rate => {
        expect(() => FFmpegValidator.validateSampleRate(rate)).toThrow(FFmpegValidationError);
      });
    });
  });

  describe('validateChannels', () => {
    it('should accept valid channel counts', () => {
      expect(() => FFmpegValidator.validateChannels(1)).not.toThrow();
      expect(() => FFmpegValidator.validateChannels(2)).not.toThrow();
    });

    it('should reject invalid channel counts', () => {
      const invalidChannels = [0, 3, 4, 5, 6, -1];

      invalidChannels.forEach(channels => {
        expect(() => FFmpegValidator.validateChannels(channels)).toThrow(FFmpegValidationError);
      });
    });
  });

  describe('validateBitrate', () => {
    it('should accept valid bitrates', () => {
      expect(() => FFmpegValidator.validateBitrate(64)).not.toThrow();
      expect(() => FFmpegValidator.validateBitrate(128)).not.toThrow();
      expect(() => FFmpegValidator.validateBitrate(320)).not.toThrow();
      expect(() => FFmpegValidator.validateBitrate(undefined)).not.toThrow();
    });

    it('should reject invalid bitrates', () => {
      expect(() => FFmpegValidator.validateBitrate(0)).toThrow(FFmpegValidationError);
      expect(() => FFmpegValidator.validateBitrate(-1)).toThrow(FFmpegValidationError);
      expect(() => FFmpegValidator.validateBitrate(10001)).toThrow(FFmpegValidationError);
    });
  });

  describe('validateEncodingParams', () => {
    it('should accept valid encoding parameters', () => {
      const validParams = {
        codec: 'aac' as const,
        sampleRate: 44100 as const,
        channels: 2 as const,
        bitrate: 128
      };

      expect(() => FFmpegValidator.validateEncodingParams(validParams)).not.toThrow();
    });

    it('should reject invalid encoding parameters', () => {
      const invalidParams = {
        codec: 'invalid' as any,
        sampleRate: 44100 as const,
        channels: 1 as const
      };

      expect(() => FFmpegValidator.validateEncodingParams(invalidParams)).toThrow(FFmpegValidationError);
    });
  });

  describe('validateInputFile', () => {
    it('should reject empty or non-string paths', async () => {
      await expect(FFmpegValidator.validateInputFile('')).rejects.toThrow(FFmpegValidationError);
      await expect(FFmpegValidator.validateInputFile(null as any)).rejects.toThrow(FFmpegValidationError);
    });

    it('should reject non-existent files', async () => {
      const nonExistentPath = path.join(tmpdir(), 'non-existent-file-' + Date.now() + '.txt');
      await expect(FFmpegValidator.validateInputFile(nonExistentPath)).rejects.toThrow(FFmpegValidationError);
    });

    it('should accept existing readable files', async () => {
      const testFile = path.join(tmpdir(), 'test-input-' + Date.now() + '.txt');
      await fs.writeFile(testFile, 'test content');

      try {
        await expect(FFmpegValidator.validateInputFile(testFile)).resolves.not.toThrow();
      } finally {
        if (existsSync(testFile)) {
          await fs.unlink(testFile);
        }
      }
    });
  });

  describe('validateOutputPath', () => {
    it('should reject empty or non-string paths', async () => {
      await expect(FFmpegValidator.validateOutputPath('')).rejects.toThrow(FFmpegValidationError);
      await expect(FFmpegValidator.validateOutputPath(null as any)).rejects.toThrow(FFmpegValidationError);
    });

    it('should reject non-existent directories', async () => {
      const nonExistentDir = path.join(tmpdir(), 'non-existent-dir-' + Date.now());
      const outputPath = path.join(nonExistentDir, 'output.txt');
      
      await expect(FFmpegValidator.validateOutputPath(outputPath)).rejects.toThrow(FFmpegValidationError);
    });

    it('should accept writable output directories', async () => {
      const outputDir = tmpdir();
      const outputPath = path.join(outputDir, 'test-output-' + Date.now() + '.txt');

      await expect(FFmpegValidator.validateOutputPath(outputPath)).resolves.not.toThrow();
    });
  });

  describe('validateFilePath', () => {
    it('should reject empty or non-string paths', () => {
      expect(() => FFmpegValidator.validateFilePath('', 'test')).toThrow(FFmpegValidationError);
      expect(() => FFmpegValidator.validateFilePath(null as any, 'test')).toThrow(FFmpegValidationError);
    });

    it('should accept valid file paths', () => {
      expect(() => FFmpegValidator.validateFilePath('/path/to/file.txt', 'test')).not.toThrow();
      expect(() => FFmpegValidator.validateFilePath('C:\\path\\to\\file.txt', 'test')).not.toThrow();
      expect(() => FFmpegValidator.validateFilePath('relative/path/file.txt', 'test')).not.toThrow();
    });
  });
});

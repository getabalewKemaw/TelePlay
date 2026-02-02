/**
 * Compression Validator Unit Tests
 * Tests parameter validation for compression operations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CompressionValidator } from '../validators/CompressionValidator.js';
import { CompressionValidationError } from '../errors/CompressionErrors.js';
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
      access: vi.fn()
    }
  };
});

describe('CompressionValidator', () => {
  describe('validateLevel', () => {
    it('should accept valid compression levels', () => {
      const validLevels = ['low', 'medium', 'high', 'maximum'];
      
      validLevels.forEach(level => {
        expect(() => CompressionValidator.validateLevel(level)).not.toThrow();
      });
    });

    it('should reject invalid compression levels', () => {
      const invalidLevels = ['invalid', 'very-high', '', 'none'];
      
      invalidLevels.forEach(level => {
        expect(() => CompressionValidator.validateLevel(level)).toThrow(CompressionValidationError);
      });
    });
  });

  describe('validateStrategy', () => {
    it('should accept valid compression strategies', () => {
      const validStrategies = ['size', 'quality', 'balanced', 'fast'];
      
      validStrategies.forEach(strategy => {
        expect(() => CompressionValidator.validateStrategy(strategy)).not.toThrow();
      });
    });

    it('should reject invalid compression strategies', () => {
      const invalidStrategies = ['invalid', 'best', '', 'none'];
      
      invalidStrategies.forEach(strategy => {
        expect(() => CompressionValidator.validateStrategy(strategy)).toThrow(CompressionValidationError);
      });
    });
  });

  describe('validateBitrate', () => {
    it('should accept valid bitrates', () => {
      expect(() => CompressionValidator.validateBitrate(64)).not.toThrow();
      expect(() => CompressionValidator.validateBitrate(128)).not.toThrow();
      expect(() => CompressionValidator.validateBitrate(256)).not.toThrow();
      expect(() => CompressionValidator.validateBitrate(undefined)).not.toThrow();
    });

    it('should reject invalid bitrates', () => {
      expect(() => CompressionValidator.validateBitrate(0)).toThrow(CompressionValidationError);
      expect(() => CompressionValidator.validateBitrate(-1)).toThrow(CompressionValidationError);
      expect(() => CompressionValidator.validateBitrate(1001)).toThrow(CompressionValidationError);
    });
  });

  describe('validateTargetSize', () => {
    it('should accept valid target sizes', () => {
      expect(() => CompressionValidator.validateTargetSize(1024)).not.toThrow();
      expect(() => CompressionValidator.validateTargetSize(1024 * 1024)).not.toThrow();
      expect(() => CompressionValidator.validateTargetSize(undefined)).not.toThrow();
    });

    it('should reject invalid target sizes', () => {
      expect(() => CompressionValidator.validateTargetSize(0)).toThrow(CompressionValidationError);
      expect(() => CompressionValidator.validateTargetSize(-1)).toThrow(CompressionValidationError);
      expect(() => CompressionValidator.validateTargetSize(11 * 1024 * 1024 * 1024)).toThrow(CompressionValidationError);
    });
  });

  describe('validateInputFile', () => {
    it('should reject empty or non-string paths', async () => {
      await expect(CompressionValidator.validateInputFile('')).rejects.toThrow(CompressionValidationError);
      await expect(CompressionValidator.validateInputFile(null as any)).rejects.toThrow(CompressionValidationError);
    });

    it('should reject non-existent files', async () => {
      vi.mocked(existsSync).mockReturnValue(false);
      
      await expect(
        CompressionValidator.validateInputFile('/nonexistent/file.wav')
      ).rejects.toThrow(CompressionValidationError);
    });

    it('should accept existing readable files', async () => {
      const testFile = path.join(tmpdir(), `test-input-${Date.now()}.wav`);
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(fs.access).mockResolvedValue(undefined);

      await expect(CompressionValidator.validateInputFile(testFile)).resolves.not.toThrow();
    });
  });

  describe('validateOutputPath', () => {
    it('should reject empty or non-string paths', async () => {
      await expect(CompressionValidator.validateOutputPath('')).rejects.toThrow(CompressionValidationError);
      await expect(CompressionValidator.validateOutputPath(null as any)).rejects.toThrow(CompressionValidationError);
    });

    it('should reject non-existent directories', async () => {
      vi.mocked(existsSync).mockImplementation((path: string) => {
        return !path.includes('nonexistent');
      });
      
      const outputPath = path.join('/nonexistent', 'output.aac');
      await expect(
        CompressionValidator.validateOutputPath(outputPath)
      ).rejects.toThrow(CompressionValidationError);
    });

    it('should accept writable output directories', async () => {
      const outputDir = tmpdir();
      const outputPath = path.join(outputDir, 'output.aac');
      
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(fs.access).mockResolvedValue(undefined);

      await expect(CompressionValidator.validateOutputPath(outputPath)).resolves.not.toThrow();
    });
  });

  describe('validateOptions', () => {
    it('should validate all options', () => {
      const validOptions = {
        level: 'medium' as const,
        strategy: 'balanced' as const,
        targetBitrate: 96,
        targetSize: 1024 * 1024
      };

      expect(() => CompressionValidator.validateOptions(validOptions)).not.toThrow();
    });

    it('should throw error for invalid options', () => {
      const invalidOptions = {
        level: 'invalid' as any,
        strategy: 'balanced' as const
      };

      expect(() => CompressionValidator.validateOptions(invalidOptions)).toThrow(CompressionValidationError);
    });
  });
});

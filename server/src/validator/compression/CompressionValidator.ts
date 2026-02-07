
import type { CompressionLevel ,CompressionOptions,CompressionStrategy} from '../../types/compression/CompressionTypes.js';

import { CompressionValidationError } from '../../errors/compression/CompressionErrors.js';
import { existsSync } from 'fs';
import { promises as fs } from 'fs';
import path from 'path';

export class CompressionValidator {
  static validateLevel(level: string): asserts level is CompressionLevel {
    const validLevels: CompressionLevel[] = ['low', 'medium', 'high', 'maximum'];
    if (!validLevels.includes(level as CompressionLevel)) {
      throw new CompressionValidationError(
        `Invalid compression level: ${level}. Valid levels: ${validLevels.join(', ')}`,
        'level'
      );
    }
  }

  /**
   * Validates compression strategy
   */
  static validateStrategy(strategy: string): asserts strategy is CompressionStrategy {
    const validStrategies: CompressionStrategy[] = ['size', 'quality', 'balanced', 'fast'];
    if (!validStrategies.includes(strategy as CompressionStrategy)) {
      throw new CompressionValidationError(
        `Invalid compression strategy: ${strategy}. Valid strategies: ${validStrategies.join(', ')}`,
        'strategy'
      );
    }
  }

  /**
   * Validates target bitrate
   */
  static validateBitrate(bitrate: number | undefined): void {
    if (bitrate !== undefined) {
      if (bitrate <= 0 || bitrate > 1000) {
        throw new CompressionValidationError(
          `Invalid target bitrate: ${bitrate}kbps. Must be between 1 and 1000 kbps`,
          'targetBitrate'
        );
      }
    }
  }

  /**
   * Validates target size
   */
  static validateTargetSize(size: number | undefined): void {
    if (size !== undefined) {
      if (size <= 0 || size > 10 * 1024 * 1024 * 1024) { // 10GB max
        throw new CompressionValidationError(
          `Invalid target size: ${size} bytes. Must be between 1 and 10GB`,
          'targetSize'
        );
      }
    }
  }

  /**
   * Validates input file exists and is accessible
   */
  static async validateInputFile(filePath: string): Promise<void> {
    if (!filePath || typeof filePath !== 'string') {
      throw new CompressionValidationError(
        'Input file path is required and must be a string',
        'inputPath'
      );
    }

    if (!existsSync(filePath)) {
      throw new CompressionValidationError(
        `Input file does not exist: ${filePath}`,
        'inputPath'
      );
    }

    try {
      await fs.access(filePath, fs.constants.R_OK);
    } catch (error) {
      throw new CompressionValidationError(
        `Input file is not readable: ${filePath}`,
        'inputPath'
      );
    }
  }

  /**
   * Validates output directory exists and is writable
   */
  static async validateOutputPath(filePath: string): Promise<void> {
    if (!filePath || typeof filePath !== 'string') {
      throw new CompressionValidationError(
        'Output file path is required and must be a string',
        'outputPath'
      );
    }

    const outputDir = path.dirname(filePath);
    
    if (!existsSync(outputDir)) {
      throw new CompressionValidationError(
        `Output directory does not exist: ${outputDir}`,
        'outputPath'
      );
    }

    try {
      await fs.access(outputDir, fs.constants.W_OK);
    } catch (error) {
      throw new CompressionValidationError(
        `Output directory is not writable: ${outputDir}`,
        'outputPath'
      );
    }
  }

  /**
   * Validates compression options
   */
  static validateOptions(options: CompressionOptions): void {
    if (options.level) {
      this.validateLevel(options.level);
    }

    if (options.strategy) {
      this.validateStrategy(options.strategy);
    }

    this.validateBitrate(options.targetBitrate);
    this.validateTargetSize(options.targetSize);
  }
}

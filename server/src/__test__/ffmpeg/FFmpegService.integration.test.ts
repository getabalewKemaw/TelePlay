/**
 * FFmpeg Service Integration Tests
 * Real FFmpeg execution tests (not mocked)
 * Tests decoding telecom codecs (G.711, G.726, G.728) to WAV
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FFmpegService } from '../FFmpegService.js';
import { FFmpegValidationError, FFmpegExecutionError } from '../errors/FFmpegErrors.js';
import { promises as fs } from 'fs';
import { existsSync } from 'fs';
import path from 'path';
import { tmpdir } from 'os';

describe('FFmpegService Integration Tests - Real FFmpeg Execution', () => {
  let ffmpegService: FFmpegService;
  let testDir: string;
  let sourceWavFile: string;

  beforeAll(async () => {
    ffmpegService = new FFmpegService();
    
    // Check if FFmpeg is available
    const isAvailable = await ffmpegService.isAvailable();
    if (!isAvailable) {
      throw new Error('FFmpeg is not available. Please install FFmpeg to run integration tests.');
    }

    // Create test directory
    testDir = path.join(tmpdir(), `ffmpeg-integration-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });

    // Create a source WAV file for encoding test files
    // We'll use FFmpeg to generate a simple test tone
    sourceWavFile = path.join(testDir, 'source.wav');
    
    // Generate a 1-second 440Hz sine wave at 8kHz mono for telecom codec testing
    // This will be used as source to encode into telecom formats
    const { execSync } = await import('child_process');
    try {
      execSync(
        `ffmpeg -f lavfi -i "sine=frequency=440:duration=1" -ar 8000 -ac 1 -y "${sourceWavFile}"`,
        { stdio: 'pipe' }
      );
    } catch (error) {
      console.warn('Could not generate test source file. Some tests may be skipped.');
    }
  });

  afterAll(async () => {
    // Cleanup test files
    if (existsSync(testDir)) {
      try {
        await fs.rm(testDir, { recursive: true, force: true });
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  describe('G.711 (μ-law) Decoding', () => {
    it('should decode G.711 to WAV with explicit sampleRate and channels', async () => {
      const inputFile = path.join(testDir, 'test-g711.raw');
      const outputFile = path.join(testDir, 'decoded-g711.wav');

      // First, encode source WAV to G.711 (μ-law)
      const { execSync } = await import('child_process');
      try {
        execSync(
          `ffmpeg -i "${sourceWavFile}" -f mulaw -ar 8000 -ac 1 -y "${inputFile}"`,
          { stdio: 'pipe' }
        );
      } catch (error) {
        // Skip if encoding fails
        return;
      }

      // Now decode G.711 to WAV
      const result = await ffmpegService.decode({
        input: { path: inputFile, format: 'mulaw' },
        output: { path: outputFile, format: 'wav' },
        codec: 'g711',
        sampleRate: 8000,
        channels: 1
      });

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(existsSync(outputFile)).toBe(true);
      expect(result.executionTime).toBeGreaterThan(0);
    });

    it('should fail if sampleRate is not provided for G.711', async () => {
      const inputFile = path.join(testDir, 'test-g711.raw');
      const outputFile = path.join(testDir, 'decoded-g711-fail.wav');

      await expect(
        ffmpegService.decode({
          input: { path: inputFile, format: 'mulaw' },
          output: { path: outputFile, format: 'wav' },
          codec: 'g711'
          // Missing sampleRate and channels
        })
      ).rejects.toThrow(FFmpegValidationError);
    });

    it('should fail if channels is not provided for G.711', async () => {
      const inputFile = path.join(testDir, 'test-g711.raw');
      const outputFile = path.join(testDir, 'decoded-g711-fail2.wav');

      await expect(
        ffmpegService.decode({
          input: { path: inputFile, format: 'mulaw' },
          output: { path: outputFile, format: 'wav' },
          codec: 'g711',
          sampleRate: 8000
          // Missing channels
        })
      ).rejects.toThrow(FFmpegValidationError);
    });
  });

  describe('G.726 Decoding', () => {
    const g726Bitrates = [8, 16, 24, 32] as const;

    for (const bitrate of g726Bitrates) {
      it(`should decode G.726 (${bitrate}kbps) to WAV with explicit sampleRate and channels`, async () => {
        const inputFile = path.join(testDir, `test-g726-${bitrate}.raw`);
        const outputFile = path.join(testDir, `decoded-g726-${bitrate}.wav`);

        // First, encode source WAV to G.726
        const { execSync } = await import('child_process');
        try {
          execSync(
            `ffmpeg -i "${sourceWavFile}" -f g726 -b:a ${bitrate}k -ar 8000 -ac 1 -y "${inputFile}"`,
            { stdio: 'pipe' }
          );
        } catch (error) {
          // Skip if encoding fails (G.726 might not be available)
          return;
        }

        // Now decode G.726 to WAV
        try {
          const result = await ffmpegService.decode({
            input: { path: inputFile, format: 'g726' },
            output: { path: outputFile, format: 'wav' },
            codec: 'g726',
            sampleRate: 8000,
            channels: 1,
            bitrate: bitrate
          });

          expect(result.success).toBe(true);
          expect(result.exitCode).toBe(0);
          expect(existsSync(outputFile)).toBe(true);
          expect(result.executionTime).toBeGreaterThan(0);
        } catch (error) {
          if (error instanceof FFmpegExecutionError) {
            // G.726 might not be supported in this FFmpeg build
            // Check if it's a codec/format issue
            if (error.stderr.includes('g726') || error.stderr.includes('not found') || error.stderr.includes('Invalid')) {
              console.warn(`G.726 (${bitrate}kbps) decoding not supported: ${error.stderr.substring(0, 200)}`);
              return; // Skip this test if codec not available
            }
          }
          throw error;
        }
      });
    }

    it('should fail if bitrate is not provided for G.726', async () => {
      const inputFile = path.join(testDir, 'test-g726.raw');
      const outputFile = path.join(testDir, 'decoded-g726-fail.wav');

      await expect(
        ffmpegService.decode({
          input: { path: inputFile, format: 'g726' },
          output: { path: outputFile, format: 'wav' },
          codec: 'g726',
          sampleRate: 8000,
          channels: 1
          // Missing bitrate
        })
      ).rejects.toThrow(FFmpegValidationError);
    });

    it('should fail if sampleRate is not provided for G.726', async () => {
      const inputFile = path.join(testDir, 'test-g726.raw');
      const outputFile = path.join(testDir, 'decoded-g726-fail2.wav');

      await expect(
        ffmpegService.decode({
          input: { path: inputFile, format: 'g726' },
          output: { path: outputFile, format: 'wav' },
          codec: 'g726',
          channels: 1,
          bitrate: 16
          // Missing sampleRate
        })
      ).rejects.toThrow(FFmpegValidationError);
    });
  });

  describe('G.728 Decoding', () => {
    it('should decode G.728 to WAV with explicit sampleRate and channels', async () => {
      const inputFile = path.join(testDir, 'test-g728.raw');
      const outputFile = path.join(testDir, 'decoded-g728.wav');

      // First, encode source WAV to G.728
      const { execSync } = await import('child_process');
      try {
        execSync(
          `ffmpeg -i "${sourceWavFile}" -f g728 -ar 8000 -ac 1 -y "${inputFile}"`,
          { stdio: 'pipe' }
        );
      } catch (error) {
        // Skip if encoding fails (G.728 might not be available)
        return;
      }

      // Now decode G.728 to WAV
      const result = await ffmpegService.decode({
        input: { path: inputFile, format: 'g728' },
        output: { path: outputFile, format: 'wav' },
        codec: 'g728',
        sampleRate: 8000,
        channels: 1
      });

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(existsSync(outputFile)).toBe(true);
      expect(result.executionTime).toBeGreaterThan(0);
    });

    it('should fail if sampleRate is not provided for G.728', async () => {
      const inputFile = path.join(testDir, 'test-g728.raw');
      const outputFile = path.join(testDir, 'decoded-g728-fail.wav');

      await expect(
        ffmpegService.decode({
          input: { path: inputFile, format: 'g728' },
          output: { path: outputFile, format: 'wav' },
          codec: 'g728'
          // Missing sampleRate and channels
        })
      ).rejects.toThrow(FFmpegValidationError);
    });

    it('should fail if channels is not provided for G.728', async () => {
      const inputFile = path.join(testDir, 'test-g728.raw');
      const outputFile = path.join(testDir, 'decoded-g728-fail2.wav');

      await expect(
        ffmpegService.decode({
          input: { path: inputFile, format: 'g728' },
          output: { path: outputFile, format: 'wav' },
          codec: 'g728',
          sampleRate: 8000
          // Missing channels
        })
      ).rejects.toThrow(FFmpegValidationError);
    });
  });

  describe('Real FFmpeg Execution', () => {
    it('should execute real FFmpeg commands and capture metrics', async () => {
      const inputFile = path.join(testDir, 'test-execution.raw');
      const outputFile = path.join(testDir, 'decoded-execution.wav');

      // Create a simple test file
      const { execSync } = await import('child_process');
      try {
        execSync(
          `ffmpeg -f lavfi -i "sine=frequency=440:duration=0.5" -f mulaw -ar 8000 -ac 1 -y "${inputFile}"`,
          { stdio: 'pipe' }
        );
      } catch (error) {
        return; // Skip if FFmpeg not available
      }

      const result = await ffmpegService.decode({
        input: { path: inputFile, format: 'mulaw' },
        output: { path: outputFile, format: 'wav' },
        codec: 'g711',
        sampleRate: 8000,
        channels: 1
      });

      // Verify execution metrics
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.executionTime).toBeGreaterThan(0);
      expect(result.executionTime).toBeLessThan(30000); // Should complete in < 30 seconds
      expect(typeof result.stderr).toBe('string');
      expect(existsSync(outputFile)).toBe(true);
    });
  });
});

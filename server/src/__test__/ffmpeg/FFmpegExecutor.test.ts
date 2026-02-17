/**
 * FFmpeg Executor Unit Tests
 * Tests the FFmpeg executor implementation with mocks
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createFFmpegExecutor, type FFmpegExecutor } from '../../services/ffmpeg/implementations/FFmpegExecutor.js';
import type { FFmpegCommandOptions } from '../../types/ffmpeg/FFmpegTypes.js';
import { spawn } from 'child_process';

// Mock child_process
vi.mock('child_process', () => {
  return {
    spawn: vi.fn()
  };
});

describe('FFmpegExecutor', () => {
  let executor: FFmpegExecutor;
  let mockProcess: any;

  beforeEach(() => {
    executor = createFFmpegExecutor('ffmpeg', 5000);
    mockProcess = {
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      on: vi.fn(),
      kill: vi.fn()
    };
    vi.mocked(spawn).mockReturnValue(mockProcess as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should successfully execute FFmpeg command', async () => {
      const options: FFmpegCommandOptions = {
        input: 'input.wav',
        output: 'output.mp3',
        codec: 'mp3',
        sampleRate: 44100,
        channels: 2
      };

      // Setup successful execution
      let closeHandler: (code: number) => void;
      mockProcess.on.mockImplementation((event: string, handler: any) => {
        if (event === 'close') {
          closeHandler = handler;
          // Simulate successful close
          setTimeout(() => handler(0), 10);
        }
      });

      const promise = executor.execute(options);
      
      // Simulate stdout and stderr
      const stdoutHandler = mockProcess.stdout.on.mock.calls.find(([event]) => event === 'data')?.[1];
      const stderrHandler = mockProcess.stderr.on.mock.calls.find(([event]) => event === 'data')?.[1];
      
      if (stdoutHandler) stdoutHandler(Buffer.from('FFmpeg output'));
      if (stderrHandler) stderrHandler(Buffer.from('Processing...'));

      const result = await promise;

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.outputPath).toBe(options.output);
      expect(spawn).toHaveBeenCalledWith('ffmpeg', expect.arrayContaining(['-i', 'input.wav']), expect.any(Object));
    });

    it('should handle execution failure', async () => {
      const options: FFmpegCommandOptions = {
        input: 'input.wav',
        output: 'output.mp3'
      };

      mockProcess.on.mockImplementation((event: string, handler: any) => {
        if (event === 'close') {
          setTimeout(() => handler(1), 10);
        }
      });

      const stderrHandler = mockProcess.stderr.on.mock.calls.find(([event]) => event === 'data')?.[1];
      if (stderrHandler) stderrHandler(Buffer.from('Error: Invalid input'));

      await expect(executor.execute(options)).rejects.toMatchObject({ name: 'FFmpegExecutionError' });
    });

    it('should handle timeout', async () => {
      const options: FFmpegCommandOptions = {
        input: 'input.wav',
        output: 'output.mp3'
      };

      executor = createFFmpegExecutor('ffmpeg', 100); // Short timeout

      mockProcess.on.mockImplementation((event: string, handler: any) => {
        if (event === 'close') {
          // Don't call close handler - simulate timeout
        }
      });

      await expect(executor.execute(options, 100)).rejects.toMatchObject({ name: 'FFmpegTimeoutError' });
      expect(mockProcess.kill).toHaveBeenCalledWith('SIGTERM');
    });

    it('should handle spawn errors', async () => {
      const options: FFmpegCommandOptions = {
        input: 'input.wav',
        output: 'output.mp3'
      };

      mockProcess.on.mockImplementation((event: string, handler: any) => {
        if (event === 'error') {
          setTimeout(() => handler(new Error('Spawn failed')), 10);
        }
      });

      await expect(executor.execute(options)).rejects.toMatchObject({ name: 'FFmpegExecutionError' });
    });

    it('should build correct command arguments', async () => {
      const options: FFmpegCommandOptions = {
        input: 'input.wav',
        output: 'output.mp3',
        codec: 'aac',
        sampleRate: 44100,
        channels: 2,
        bitrate: 128,
        format: 'mp3'
      };

      mockProcess.on.mockImplementation((event: string, handler: any) => {
        if (event === 'close') {
          setTimeout(() => handler(0), 10);
        }
      });

      await executor.execute(options);

      const spawnArgs = vi.mocked(spawn).mock.calls[0][1] as string[];
      expect(spawnArgs).toContain('-i');
      expect(spawnArgs).toContain('input.wav');
      expect(spawnArgs).toContain('-acodec');
      expect(spawnArgs).toContain('aac');
      expect(spawnArgs).toContain('-ar');
      expect(spawnArgs).toContain('44100');
      expect(spawnArgs).toContain('-ac');
      expect(spawnArgs).toContain('2');
      expect(spawnArgs).toContain('-b:a');
      expect(spawnArgs).toContain('128k');
      expect(spawnArgs).toContain('-f');
      expect(spawnArgs).toContain('mp3');
      expect(spawnArgs).toContain('-y');
      expect(spawnArgs).toContain('output.mp3');
    });
  });

  describe('isAvailable', () => {
    it('should return true when FFmpeg is available', async () => {
      mockProcess.on.mockImplementation((event: string, handler: any) => {
        if (event === 'close') {
          setTimeout(() => handler(0), 10);
        }
      });

      const stdoutHandler = mockProcess.stdout.on.mock.calls.find(([event]) => event === 'data')?.[1];
      if (stdoutHandler) stdoutHandler(Buffer.from('ffmpeg version 4.4.0'));

      const available = await executor.isAvailable();
      expect(available).toBe(true);
    });

    it('should return false when FFmpeg is not available', async () => {
      mockProcess.on.mockImplementation((event: string, handler: any) => {
        if (event === 'error') {
          setTimeout(() => handler(new Error('Command not found')), 10);
        }
      });

      const available = await executor.isAvailable();
      expect(available).toBe(false);
    });
  });

  describe('getVersion', () => {
    it('should return FFmpeg version', async () => {
      // Create a fresh mock process for this test
      const versionMockProcess: any = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn(),
        kill: vi.fn()
      };
      
      vi.mocked(spawn).mockReturnValue(versionMockProcess as any);
      
      let stdoutHandler: ((data: Buffer) => void) | undefined;
      let closeHandler: ((code: number) => void) | undefined;

      versionMockProcess.stdout.on.mockImplementation((event: string, handler: any) => {
        if (event === 'data') {
          stdoutHandler = handler;
        }
      });

      versionMockProcess.on.mockImplementation((event: string, handler: any) => {
        if (event === 'close') {
          closeHandler = handler;
        }
      });

      const versionPromise = executor.getVersion();
      
      // Simulate stdout data
      if (stdoutHandler) {
        stdoutHandler(Buffer.from('ffmpeg version 4.4.0\nCopyright (c) 2000-2021'));
      }
      
      // Then close with success
      if (closeHandler) {
        setTimeout(() => closeHandler(0), 10);
      }

      const version = await versionPromise;
      expect(version).toContain('ffmpeg version');
      expect(spawn).toHaveBeenCalledWith('ffmpeg', ['-version'], expect.any(Object));
    });

    it('should throw error when version check fails', async () => {
      const errorMockProcess: any = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn(),
        kill: vi.fn()
      };
      
      vi.mocked(spawn).mockReturnValue(errorMockProcess as any);
      
      errorMockProcess.on.mockImplementation((event: string, handler: any) => {
        if (event === 'close') {
          setTimeout(() => handler(1), 10);
        }
      });

      await expect(executor.getVersion()).rejects.toMatchObject({ name: 'FFmpegExecutionError' });
    });
  });
});

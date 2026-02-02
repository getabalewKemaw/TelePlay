/**
 * FFprobe Metadata Provider Implementation
 * Uses FFprobe to extract media metadata
 */

import { spawn } from 'child_process';
import type { IMediaMetadataProvider } from '../../../interfaces/chunking/IMediaMetadataProvider.js';
import type { MediaMetadata } from '../../../types/chunking/ChunkingTypes.js';
import { ChunkingMetadataError } from '../../../errors/chunking/ChunkingErrors.js';
const FFPROBE_EXECUTABLE = 'ffprobe';
export class FFprobeMetadataProvider implements IMediaMetadataProvider {
  private readonly executable: string;
 constructor(executable: string = FFPROBE_EXECUTABLE) {
    this.executable = executable;
  }
  async getMetadata(filePath: string): Promise<MediaMetadata> {
    return new Promise<MediaMetadata>((resolve, reject) => {
      const process = spawn(
        this.executable,
        [
          '-v', 'error',
          '-show_entries', 'format=duration,size,bit_rate,format_name',
          '-show_entries', 'stream=codec_name',
          '-of', 'json',
          filePath
        ],
        {
          stdio: ['ignore', 'pipe', 'pipe']
        }
      );
      let stdout = '';
      let stderr = '';
      if (process.stdout) {
        process.stdout.on('data', (data: Buffer) => {
          stdout += data.toString();
        });
      }

      if (process.stderr) {
        process.stderr.on('data', (data: Buffer) => {
          stderr += data.toString();
        });
      }
      process.on('close', (exitCode) => {
        if (exitCode !== 0) {
          reject(
            new ChunkingMetadataError(
              `FFprobe failed with exit code ${exitCode}: ${stderr}`,
              filePath
            )
          );
          return;
        }

        try {
          const metadata = this.parseFFprobeOutput(stdout, filePath);
          resolve(metadata);
        } catch (error) {
          reject(
            new ChunkingMetadataError(
              `Failed to parse FFprobe output: ${error instanceof Error ? error.message : String(error)}`,
              filePath
            )
          );
        }
      });
      process.on('error', (error: Error) => {
        reject(
          new ChunkingMetadataError(
            `Failed to spawn FFprobe process: ${error.message}`,
            filePath
          )
        );
      });
    });
  }
  /**
   * Parse FFprobe JSON output
   */
  private parseFFprobeOutput(output: string, filePath: string): MediaMetadata {
    const data = JSON.parse(output);

    const format = data.format || {};
    const stream = data.streams?.[0] || {};

    const duration = parseFloat(format.duration || '0');
    if (isNaN(duration) || duration <= 0) {
      throw new Error('Invalid or missing duration in media file');
    }

    return {
      duration,
      fileSize: format.size ? parseInt(format.size, 10) : undefined,
      format: format.format_name,
      codec: stream.codec_name,
      bitrate: format.bit_rate ? parseInt(format.bit_rate, 10) : undefined
    };
  }
}

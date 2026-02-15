/**
 * FFprobe Metadata Provider Implementation
 * use  FFprobe to extract media metadata
 */
import { spawn } from 'child_process';
import { stat } from 'fs/promises';
import path from 'path';
import type { IMediaMetadataProvider } from '../../../interfaces/chunking/IMediaMetadataProvider.js';
import type { MediaMetadata } from '../../../types/chunking/ChunkingTypes.js';
import { ChunkingMetadataError } from '../../../errors/chunking/ChunkingErrors.js';
import { FFPROBE_EXECUTABLE,type RawFileProfile, BASE_ARGS,RAW_PROFILES} from '../../../utils/chunking/chunlingUtils.js';
export class FFprobeMetadataProvider implements IMediaMetadataProvider {
  private readonly executable: string;
  constructor(executable: string = FFPROBE_EXECUTABLE) {
    this.executable = executable;
  }

  private runProbe(filePath: string, args: string[]): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const process = spawn(this.executable, args, { stdio: ['ignore', 'pipe', 'pipe'] });
      let stdout = '';
      let stderr = '';

      process.stdout?.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      process.stderr?.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      process.on('close', (exitCode) => {
        if (exitCode !== 0) {
          reject(new ChunkingMetadataError(`FFprobe failed with exit code ${exitCode}: ${stderr}`, filePath));
          return;
        }
        resolve(stdout);
      });

      process.on('error', (error: Error) => {
        reject(new ChunkingMetadataError(`Failed to spawn FFprobe process: ${error.message}`, filePath));
      });
    });
  }

  private buildRawArgs(filePath: string, profile: RawFileProfile): string[] {
    return [
      ...BASE_ARGS,
      '-f', profile.format,
      '-ar', profile.sampleRate.toString(),
      '-ac', profile.channels.toString(),
      filePath
    ];
  }

  async getMetadata(filePath: string): Promise<MediaMetadata> {
    try {
      const stdout = await this.runProbe(filePath, [...BASE_ARGS, filePath]);
      return this.parseFFprobeOutput(stdout, filePath);
    } catch (error) {
      const ext = path.extname(filePath).toLowerCase();
      const profile = RAW_PROFILES[ext];
      if (profile) {
        try {
          const stdout = await this.runProbe(filePath, this.buildRawArgs(filePath, profile));
          return this.parseFFprobeOutput(stdout, filePath, profile);
        } catch {
          return this.fallbackRawMetadata(filePath, profile);
        }
      }
      throw error;
    }
  }
  // parse the ffprobe json output.
  private parseFFprobeOutput(output: string, filePath: string, fallback?: { codec: string; bitrate: number }): MediaMetadata {
    let data: any;
    try {
      data = JSON.parse(output);
    } catch {
      throw new ChunkingMetadataError('FFprobe returned invalid JSON output', filePath);
    }

    const format = data.format ?? {};
    const stream = data.streams?.[0] ?? {};
    let duration = parseFloat(format.duration ?? '0');
    const bitrate = format.bit_rate ? parseInt(format.bit_rate, 10) : undefined;
    const size = format.size ? parseInt(format.size, 10) : undefined;

    if ((!Number.isFinite(duration) || duration <= 0) && size && (bitrate || fallback?.bitrate)) {
      const rate = bitrate ?? fallback!.bitrate;
      duration = (size * 8) / rate;
    }

    if (!Number.isFinite(duration) || duration <= 0) {
      throw new ChunkingMetadataError('Invalid or missing duration in media file', filePath);
    }

    return {
      duration,
      fileSize: size,
      format: format.format_name,
      codec: stream.codec_name || fallback?.codec,
      bitrate
    };
  }

  private async fallbackRawMetadata(
    filePath: string,
    profile: RawFileProfile
  ): Promise<MediaMetadata> {
    const stats = await stat(filePath);
    const duration = (stats.size * 8) / profile.bitrate;
    return {
      duration,
      fileSize: stats.size,
      format: profile.format,
      codec: profile.codec,
      bitrate: profile.bitrate
    };
  }
}

/**
 * FFprobe Metadata Provider Implementation
 * use  FFprobe to extract media metadata
 */
import { spawn } from 'child_process';
import path from 'path';
import type { IMediaMetadataProvider } from '../../../interfaces/chunking/IMediaMetadataProvider.js';
import type { MediaMetadata } from '../../../types/chunking/ChunkingTypes.js';
import { ChunkingMetadataError } from '../../../errors/chunking/ChunkingErrors.js';
const FFPROBE_EXECUTABLE = 'ffprobe';

type  rawFileTypes={
  format: string,
   codec: string; 
   sampleRate: number; 
   channels: number; 
   bitrate: number 
};

export class FFprobeMetadataProvider implements IMediaMetadataProvider {
  private readonly executable: string;
 constructor(executable: string = FFPROBE_EXECUTABLE) {
    this.executable = executable;
  }
  async getMetadata(filePath: string): Promise<MediaMetadata> {
    const runProbe = (args: string[]) => new Promise<string>((resolve, reject) => {
      const process = spawn(this.executable, args, { stdio: ['ignore', 'pipe', 'pipe'] });
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
          reject(new ChunkingMetadataError(`FFprobe failed with exit code ${exitCode}: ${stderr}`, filePath));
          return;
        }
        resolve(stdout);
      });
      process.on('error', (error: Error) => {
        reject(new ChunkingMetadataError(`Failed to spawn FFprobe process: ${error.message}`, filePath));
      });
    });
    const baseArgs = [
      '-v', 'error',
      '-show_entries', 'format=duration,size,bit_rate,format_name',
      '-show_entries', 'stream=codec_name',
      '-of', 'json'
    ];
    try {
      const stdout = await runProbe([...baseArgs, filePath]);
      return this.parseFFprobeOutput(stdout, filePath);
    } catch (error) {
      const ext = path.extname(filePath).toLowerCase();
      const rawProfiles: Record<string, rawFileTypes> = {
        '.g711': { format: 'mulaw', codec: 'pcm_mulaw', sampleRate: 8000, channels: 1, bitrate: 64000 },
        '.g711u': { format: 'mulaw', codec: 'pcm_mulaw', sampleRate: 8000, channels: 1, bitrate: 64000 },
        '.g711a': { format: 'alaw', codec: 'pcm_alaw', sampleRate: 8000, channels: 1, bitrate: 64000 },
        '.g726': { format: 'g726', codec: 'g726', sampleRate: 8000, channels: 1, bitrate: 32000 },
        '.g728': { format: 'g728', codec: 'g728', sampleRate: 8000, channels: 1, bitrate: 16000 },
        '.pcm': { format: 's16le', codec: 'pcm_s16le', sampleRate: 8000, channels: 1, bitrate: 128000 }
      };
      if (rawProfiles[ext]) {
        const profile = rawProfiles[ext];
        try {
          const stdout = await runProbe([
            ...baseArgs,
            '-f', profile.format,
            '-ar', profile.sampleRate.toString(),
            '-ac', profile.channels.toString(),
            filePath
          ]);
          return this.parseFFprobeOutput(stdout, filePath, profile);
        } catch {
          return this.fallbackRawMetadata(filePath, profile);
        }
      }
      throw error;
    }
  }
//parse the ffbrobe json output.
  private parseFFprobeOutput(output: string, filePath: string, fallback?: { codec: string; bitrate: number }): MediaMetadata {
    const data = JSON.parse(output);
    const format = data.format || {};
    const stream = data.streams?.[0] || {};
    let duration = parseFloat(format.duration || '0');
    const bitrate = format.bit_rate ? parseInt(format.bit_rate, 10) : undefined;
    const size = format.size ? parseInt(format.size, 10) : undefined;
    if ((isNaN(duration) || duration <= 0) && size && (bitrate || fallback?.bitrate)) {
      const rate = bitrate || fallback!.bitrate;
      duration = (size * 8) / rate;
    }
    if (isNaN(duration) || duration <= 0) {
      throw new Error('Invalid or missing duration in media file');
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
    profile: { format: string; codec: string; sampleRate: number; channels: number; bitrate: number }
  ): Promise<MediaMetadata> {
    const stats = await import('fs/promises').then(fs => fs.stat(filePath));
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

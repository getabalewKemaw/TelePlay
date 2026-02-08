
import type { SampleRate, ChannelConfig } from '../ffmpeg/FFmpegTypes.js';
export type SourceCodec =
  | 'g711'
  | 'g726'
  | 'g728'
  | 'pcm_s16le'
  | 'pcm_s24le'
  | 'aac'
  | 'mp3'
  | 'opus';
export type TargetCodec = 'aac' | 'mp3' | 'opus' | 'pcm_s16le';
export type TranscodingMode = 'chunk';
export interface SourceEncoding {
  codec: SourceCodec;
  sampleRate: SampleRate;
  channels: ChannelConfig;
  bitrate?: number; // Required for G.726
}
export interface TargetEncoding {
  codec: TargetCodec;
  sampleRate: SampleRate;
  channels: ChannelConfig;
  bitrate?: number;
}
export interface TranscodingConfig {
  source: SourceEncoding

  target: TargetEncoding;
  mode: TranscodingMode;
  startTime?: number;
  duration?: number;
}
export interface TranscodingResult {
  outputPath: string;
  originalSize: number;
  transcodedSize: number;
  executionTime: number;
  sourceCodec: SourceCodec;
  targetCodec: TargetCodec;
  config: TranscodingConfig;
}

export interface ChunkTranscodingParams {
  inputPath: string;
  outputPath: string;
  sourceEncoding: SourceEncoding;
  targetEncoding: TargetEncoding;
}


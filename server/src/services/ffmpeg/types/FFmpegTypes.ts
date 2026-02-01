/**
 * FFmpeg Service Types
 * Type definitions for FFmpeg operations, codecs, and configurations
 */

/**
 * Supported audio codecs for the media player
 */
export type AudioCodec = 'g711' | 'g726' | 'g728' | 'pcm_s16le' | 'pcm_s24le' | 'aac' | 'mp3' | 'opus';

/**
 * Supported sample rates (Hz)
 */
export type SampleRate = 8000 | 16000 | 22050 | 44100 | 48000;

/**
 * Supported channel configurations
 */
export type ChannelConfig = 1 | 2; // Mono or Stereo

/**
 * FFmpeg operation types
 */
export type FFmpegOperation = 'decode' | 'encode' | 'transcode' | 'convert';

/**
 * Input/Output file configuration
 */
export interface FileConfig {
  path: string;
  format?: string;
}

/**
 * Audio encoding parameters
 */
export interface AudioEncodingParams {
  codec: AudioCodec;
  sampleRate: SampleRate;
  channels: ChannelConfig;
  bitrate?: number; // Optional bitrate in kbps
}

/**
 * Decode operation parameters
 */
export interface DecodeParams {
  input: FileConfig;
  output: FileConfig;
  codec?: AudioCodec; // Optional: auto-detect if not provided
  sampleRate?: SampleRate; // Required for telecom codecs (G.711, G.726, G.728)
  channels?: ChannelConfig; // Required for telecom codecs (G.711, G.726, G.728)
  bitrate?: number; // Required for G.726 (8, 16, 24, 32 kbps)
}

/**
 * Encode operation parameters
 */
export interface EncodeParams {
  input: FileConfig;
  output: FileConfig;
  encoding: AudioEncodingParams;
}

/**
 * Transcode operation parameters
 */
export interface TranscodeParams {
  input: FileConfig;
  output: FileConfig;
  sourceEncoding: AudioEncodingParams;
  targetEncoding: AudioEncodingParams;
}

/**
 * Convert operation parameters (format conversion)
 */
export interface ConvertParams {
  input: FileConfig;
  output: FileConfig;
  targetFormat: string;
  encoding?: AudioEncodingParams; // Optional encoding params
}

/**
 * FFmpeg execution result
 */
export interface FFmpegExecutionResult {
  success: boolean;
  executionTime: number; // milliseconds
  exitCode: number;
  stderr: string;
  stdout?: string;
  outputPath?: string;
}

/**
 * FFmpeg command options
 */
export interface FFmpegCommandOptions {
  input: string;
  output: string;
  codec?: AudioCodec;
  sampleRate?: SampleRate;
  channels?: ChannelConfig;
  bitrate?: number;
  format?: string;
  additionalArgs?: string[]; // For extensibility
}

/**
 * Transcoding Service Types
 * Type definitions for media transcoding operations
 */


import type { SampleRate, ChannelConfig } from '../ffmpeg/FFmpegTypes.js';
/**
 * Source codec type (telecom or PCM)
 */
export type SourceCodec = 'g711' | 'g726' | 'g728' | 'pcm_s16le' | 'pcm_s24le';

/**
 * Target codec type (browser-playable)
 */
export type TargetCodec = 'aac' | 'mp3' | 'opus' | 'pcm_s16le';

/**
 * Transcoding mode
 */
export type TranscodingMode = 'chunk';

/**
 * Source encoding configuration
 */
export interface SourceEncoding {
  codec: SourceCodec;
  sampleRate: SampleRate;
  channels: ChannelConfig;
  bitrate?: number; // Required for G.726
}

/**
 * Target encoding configuration
 */
export interface TargetEncoding {
  codec: TargetCodec;
  sampleRate: SampleRate;
  channels: ChannelConfig;
  bitrate?: number;
}

/**
 * Transcoding configuration
 */
export interface TranscodingConfig {
  /**
   * Source encoding parameters
   */
  source: SourceEncoding;

  /**
   * Target encoding parameters
   */
  target: TargetEncoding;

  /**
   * Transcoding mode
   * - 'full': Transcode entire file
   * - 'chunk': Transcode a specific chunk
   * - 'stream': Transcode for streaming
   */
  mode: TranscodingMode;

  /**
   * Start time in seconds (for chunk/stream mode)
   */
  startTime?: number;

  /**
   * Duration in seconds (for chunk/stream mode)
   */
  duration?: number;
}

/**
 * Transcoding result
 */
export interface TranscodingResult {
  /**
   * Path to transcoded file
   */
  outputPath: string;

  /**
   * Original file size in bytes
   */
  originalSize: number;

  /**
   * Transcoded file size in bytes
   */
  transcodedSize: number;

  /**
   * Transcoding execution time in milliseconds
   */
  executionTime: number;

  /**
   * Source codec information
   */
  sourceCodec: SourceCodec;

  /**
   * Target codec information
   */
  targetCodec: TargetCodec;

  /**
   * Configuration used
   */
  config: TranscodingConfig;
}

/**
 * Chunk transcoding parameters
 */
export interface ChunkTranscodingParams {
  /**
   * Input chunk file path
   */
  inputPath: string;

  /**
   * Output path for transcoded chunk
   */
  outputPath: string;

  /**
   * Source encoding
   */
  sourceEncoding: SourceEncoding;

  /**
   * Target encoding
   */
  targetEncoding: TargetEncoding;
}


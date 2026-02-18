
export type AudioCodec = 'g711' | 'g726' | 'g728' | 'pcm_mulaw' | 'pcm_alaw' | 'adpcm_g726' | 'pcm_s16le' | 'pcm_s24le' | 'aac' | 'mp3' | 'opus';
export type SampleRate = 8000 | 16000 | 22050 | 44100 | 48000;
export type ChannelConfig = 1 | 2; // Mono or Stereo

export interface FileConfig {
  path: string;
  format?: string;
}
export interface AudioEncodingParams {
  codec: AudioCodec;
  sampleRate: SampleRate;
  channels: ChannelConfig;
  bitrate?: number; // Optional bitrate in kbps
}
export interface DecodeParams {
  input: FileConfig;
  output: FileConfig;
  codec?: AudioCodec;
  sampleRate?: SampleRate;
  channels?: ChannelConfig;
  bitrate?: number; // Required for G.726 (8, 16, 24, 32 kbps)
  startTime?: number;
  duration?: number;
  onProgress?: (update: FFmpegProgressUpdate) => void;
}
export interface TranscodeParams {
  input: FileConfig;
  output: FileConfig;
  sourceEncoding: AudioEncodingParams;
  targetEncoding: AudioEncodingParams;
  startTime?: number;
  duration?: number;
}
export interface FFmpegExecutionResult {
  success: boolean;
  executionTime: number; // milliseconds
  exitCode: number;
  stderr: string;
  stdout?: string;
  outputPath?: string;
}

export interface FFmpegProgressUpdate {
  frame?: number;
  fps?: number;
  bitrate?: string;
  total_size?: number;
  out_time_ms?: number;
  out_time?: string;
  speed?: string;
  progress?: string;
  [key: string]: string | number | undefined;
}

export interface FFmpegLogger {
  debug?: (message: string) => void;
  info?: (message: string) => void;
  warn?: (message: string) => void;
  error?: (message: string) => void;
}

export type FFmpegStdioMode = 'pipe' | 'ignore' | 'inherit';
export interface FFmpegCommandOptions {
  input: string;
  output: string;
  codec?: AudioCodec | undefined;
  sampleRate?: SampleRate;
  channels?: ChannelConfig;
  bitrate?: number;
  format?: string;
  startTime?: number;
  duration?: number;
  additionalArgs?: string[]; // For extensibility
  preInputArgs?: string[];
  postInputArgs?: string[];
  outputArgs?: string[];
  stdin?: FFmpegStdioMode | NodeJS.ReadableStream;
  stdout?: FFmpegStdioMode;
  stderr?: FFmpegStdioMode;
  onProgress?: (update: FFmpegProgressUpdate) => void;
  logger?: FFmpegLogger;
  validateOutput?: boolean;
  minOutputBytes?: number;
  timeoutGraceMs?: number;
  maxBufferBytes?: number;
}

import type { AudioCodec, SampleRate, ChannelConfig } from '../../types/ffmpeg/FFmpegTypes.js';
const FFMPEG_EXECUTABLE = 'ffmpeg';
const DEFAULT_TIMEOUT = 30 * 60 * 1000;
export {
  FFMPEG_EXECUTABLE,
  DEFAULT_TIMEOUT
}
export const SUPPORTED_CODECS: ReadonlySet<AudioCodec> = new Set([
  'g711',
  'g726',
  'g728',
  'pcm_mulaw',
  'pcm_alaw',
  'adpcm_g726',
  'pcm_s16le',
  'pcm_s24le',
  'aac',
  'mp3',
  'opus'
]);

export const SUPPORTED_SAMPLE_RATES: ReadonlySet<SampleRate> = new Set([
  8000, 16000, 22050, 44100, 48000
]);
export const SUPPORTED_CHANNELS: ReadonlySet<ChannelConfig> = new Set([1, 2]);

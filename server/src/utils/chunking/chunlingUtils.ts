
export const FFPROBE_EXECUTABLE = 'ffprobe';
export type RawFileProfile = {
  format: string;
  codec: string;
  sampleRate: number;
  channels: number;
  bitrate: number;
};


export const BASE_ARGS = [
  '-v', 'error',
  '-show_entries', 'format=duration,size,bit_rate,format_name',
  '-show_entries', 'stream=codec_name',
  '-of', 'json'
];

export const RAW_PROFILES: Record<string, RawFileProfile> = {
  '.g711': { format: 'mulaw', codec: 'pcm_mulaw', sampleRate: 8000, channels: 1, bitrate: 64000 },
  '.g711u': { format: 'mulaw', codec: 'pcm_mulaw', sampleRate: 8000, channels: 1, bitrate: 64000 },
  '.g711a': { format: 'alaw', codec: 'pcm_alaw', sampleRate: 8000, channels: 1, bitrate: 64000 },
  '.g726': { format: 'g726', codec: 'g726', sampleRate: 8000, channels: 1, bitrate: 32000 },
  '.g728': { format: 'g728', codec: 'g728', sampleRate: 8000, channels: 1, bitrate: 16000 },
  '.pcm': { format: 's16le', codec: 'pcm_s16le', sampleRate: 8000, channels: 1, bitrate: 128000 }
};

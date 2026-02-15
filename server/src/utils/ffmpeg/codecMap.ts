const FFMPEG_CODEC_MAP: Record<string, string> = {
  g711: 'pcm_mulaw',
  g726: 'g726',
  g728: 'g728',
  pcm_s16le: 'pcm_s16le',
  pcm_s24le: 'pcm_s24le',
  aac: 'aac',
  mp3: 'libmp3lame',
  opus: 'libopus'
};

export function mapCodecToFFmpeg(codec: string): string {
  return FFMPEG_CODEC_MAP[codec] || codec;
}

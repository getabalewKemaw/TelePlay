import type {
  DecodeParams,
  TranscodeParams,
  FFmpegCommandOptions
} from '../../types/ffmpeg/FFmpegTypes.js';
import { mapCodecToFFmpeg } from './codecMap.js';

export function normalizeDecodeCodec(codec?: string): string | undefined {
  if (!codec) return undefined;
  const normalized = codec.trim().toLowerCase();
  if (normalized === 'g711a' || normalized === 'alaw') return 'pcm_alaw';
  if (normalized === 'g711u' || normalized === 'g711' || normalized === 'mulaw') return 'pcm_mulaw';
  if (normalized === 'adpcm_g726') return 'g726';
  return normalized;
}

export function isRawCodec(codec?: string): codec is 'pcm_mulaw' | 'pcm_alaw' | 'g726' | 'g728' {
  return codec === 'pcm_mulaw' || codec === 'pcm_alaw' || codec === 'g726' || codec === 'g728';
}

export function buildDecodeAdditionalArgs(params: {
  codec?: string;
  sampleRate?: number;
  channels?: number;
  bitrate?: number;
  inputFormat?: string;
}): string[] {
  const { codec, sampleRate, channels, bitrate, inputFormat } = params;
  const additionalArgs: string[] = [];

  if (codec && isRawCodec(codec)) {
    const inputFormatMap: Record<string, string> = {
      pcm_mulaw: 'mulaw',
      pcm_alaw: 'alaw',
      g726: 'g726',
      g728: 'g728'
    };

    const format = inputFormatMap[codec];
    if (format) {
      additionalArgs.push('-f', format);
    }

    if (codec === 'g726' && bitrate) {
      const codeSize = Math.floor(bitrate / 8);
      additionalArgs.push('-code_size', codeSize.toString());
      additionalArgs.push('-acodec', 'g726');
      if (sampleRate) {
        additionalArgs.push('-sample_rate', sampleRate.toString());
      }
    } else if (codec === 'pcm_mulaw') {
      additionalArgs.push('-acodec', 'pcm_mulaw');
    } else if (codec === 'pcm_alaw') {
      additionalArgs.push('-acodec', 'pcm_alaw');
    } else if (codec === 'g728') {
      additionalArgs.push('-acodec', 'g728');
    }

    if (sampleRate && codec !== 'g726') {
      additionalArgs.push('-ar', sampleRate.toString());
    }
    if (channels) {
      additionalArgs.push('-ac', channels.toString());
    }
    return additionalArgs;
  }

  if (inputFormat) {
    additionalArgs.push('-f', inputFormat);
  }
  return additionalArgs;
}
export function buildDecodeCommandOptions(
  params: DecodeParams,
  normalizedCodec: string | undefined,
  additionalArgs: string[]
): FFmpegCommandOptions {
  const outputFormat = params.output.format || 'wav';
  const outputCodec = outputFormat === 'mp3' ? 'mp3' : undefined;

  return {
    input: params.input.path,
    output: params.output.path,
    codec: outputCodec,
    sampleRate: normalizedCodec && isRawCodec(normalizedCodec)
      ? undefined
      : params.sampleRate,
    channels: normalizedCodec && isRawCodec(normalizedCodec)
      ? undefined
      : params.channels,
    bitrate: undefined,
    format: outputFormat,
    startTime: params.startTime,
    duration: params.duration,
    additionalArgs: additionalArgs.length > 0 ? additionalArgs : undefined,
    validateOutput: true,
    minOutputBytes: 1
  };
}

export function buildTranscodeCommandOptions(
  params: TranscodeParams,
  isContainerInput: boolean,
  needsInputCodec: boolean
): FFmpegCommandOptions {
  return {
    input: params.input.path,
    output: params.output.path,
    codec: params.targetEncoding.codec,
    sampleRate: params.targetEncoding.sampleRate,
    channels: params.targetEncoding.channels,
    bitrate: params.targetEncoding.bitrate,
    format: params.output.format,
    startTime: params.startTime,
    duration: params.duration,
    additionalArgs: [
      ...(params.input.format && !isContainerInput ? ['-f', params.input.format] : []),
      ...(needsInputCodec ? [
        '-acodec', mapCodecToFFmpeg(params.sourceEncoding.codec),
        '-ar', params.sourceEncoding.sampleRate.toString(),
        '-ac', params.sourceEncoding.channels.toString()
      ] : [])
    ],
    validateOutput: true,
    minOutputBytes: 1
  };
}

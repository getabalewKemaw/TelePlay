import type { AudioEncodingParamsDto } from '../../dto/ffmpeg.dto.js';
import type {
  ChunkTranscodingParams,
  SourceCodec,
  SourceEncoding,
  TargetCodec,
  TargetEncoding
} from '../../types/transcoding/TranscodingTypes.js';
import { TranscodingValidationError } from '../../errors/transcoding/TranscodingErrors.js';

const SOURCE_CODECS = new Set<SourceCodec>([
  'g711',
  'g726',
  'g728',
  'pcm_s16le',
  'pcm_s24le',
  'aac',
  'mp3',
  'opus'
]);

const TARGET_CODECS = new Set<TargetCodec>([
  'aac',
  'mp3',
  'opus',
  'pcm_s16le'
]);

function toSourceEncoding(input: AudioEncodingParamsDto): SourceEncoding {
  if (!SOURCE_CODECS.has(input.codec as SourceCodec)) {
    throw new TranscodingValidationError(`Unsupported source codec: ${input.codec}`, 'sourceEncoding.codec');
  }
  return {
    codec: input.codec as SourceCodec,
    sampleRate: input.sampleRate,
    channels: input.channels,
    bitrate: input.bitrate
  };
}

function toTargetEncoding(input: AudioEncodingParamsDto): TargetEncoding {
  if (!TARGET_CODECS.has(input.codec as TargetCodec)) {
    throw new TranscodingValidationError(`Unsupported target codec: ${input.codec}`, 'targetEncoding.codec');
  }
  return {
    codec: input.codec as TargetCodec,
    sampleRate: input.sampleRate,
    channels: input.channels,
    bitrate: input.bitrate
  };
}

export function buildChunkTranscodingParams(
  inputPath: string,
  outputPath: string,
  sourceEncoding: AudioEncodingParamsDto,
  targetEncoding: AudioEncodingParamsDto
): ChunkTranscodingParams {
  return {
    inputPath,
    outputPath,
    sourceEncoding: toSourceEncoding(sourceEncoding),
    targetEncoding: toTargetEncoding(targetEncoding)
  };
}

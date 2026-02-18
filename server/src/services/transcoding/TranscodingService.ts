import type {
  TranscodingResult,
  ChunkTranscodingParams,
  TranscodingConfig,
  SourceCodec,
  TargetCodec
} from '../../types/transcoding/TranscodingTypes.js';
import { transcodingValidationError, transcodingCodecError, transcodingFileError } from '../../errors/transcoding/TranscodingErrors.js';
import { promises as fs } from 'fs';
import path from 'path';
import { ffmpegExecutor } from '../ffmpeg/implementations/FFmpegExecutor.js';
import { buildTranscodeCommandOptions } from '../../utils/ffmpeg/ffmpegServiceUtils.js';
import { isdirectoryExists } from '../../utils/fileUtils.js';
const DEFAULT_TARGET_CODEC: TargetCodec = 'aac';

import { CODEC_COMPATIBILITY } from '../../utils/transcoding/transcodingRequestUtils.js';

const executor = ffmpegExecutor;
const validateSourceEncoding = (encoding: { codec: SourceCodec; bitrate?: number }): void => {
  if (encoding.codec === 'g726' && !encoding.bitrate) {
    throw transcodingValidationError(
      'Source bitrate is required for G.726 codec',
      'sourceBitrate'
    );
  }
};

const validateTargetEncoding = (sourceCodec: SourceCodec, encoding: { codec: TargetCodec; bitrate?: number }): void => {
  const compatibility = CODEC_COMPATIBILITY[sourceCodec];
  if (!compatibility.compatible.includes(encoding.codec)) {
    throw transcodingValidationError(
      `Target codec ${encoding.codec} is not compatible with source codec ${sourceCodec}`,
      'targetEncoding.codec'
    );
  }
  if (encoding.bitrate !== undefined && encoding.bitrate <= 0) {
    throw transcodingValidationError(
      'Target bitrate must be greater than 0',
      'targetEncoding.bitrate'
    );
  }
};

const performTranscoding = async (
  inputPath: string,
  outputPath: string,
  config: TranscodingConfig
): Promise<void> => {
  const transcodeParams = {
    input: { path: inputPath },
    output: { path: outputPath },
    sourceEncoding: {
      codec: config.source.codec,
      sampleRate: config.source.sampleRate,
      channels: config.source.channels,
      bitrate: config.source.bitrate
    },
    targetEncoding: {
      codec: config.target.codec,
      sampleRate: config.target.sampleRate,
      channels: config.target.channels,
      bitrate: config.target.bitrate
    }
  };

  const containerExts = new Set(['.wav', '.mp3', '.aac', '.ogg', '.opus', '.m4a']);
  const inputExt = path.extname(inputPath).toLowerCase();
  const isContainerInput = containerExts.has(inputExt);
  const needsInputCodec = !isContainerInput
    && ['g711', 'g726', 'g728', 'pcm_s16le', 'pcm_s24le'].includes(config.source.codec);
  const commandOptions = buildTranscodeCommandOptions(
    transcodeParams,
    isContainerInput,
    needsInputCodec
  );

  await executor.execute(commandOptions);
};

export const transcodeChunk = async (params: ChunkTranscodingParams): Promise<TranscodingResult> => {
  if (! await isdirectoryExists(params.inputPath)) {
    throw transcodingFileError(`Chunk file does not exist: ${params.inputPath}`, params.inputPath);
  }

  validateSourceEncoding(params.sourceEncoding);
  validateTargetEncoding(params.sourceEncoding.codec, params.targetEncoding);

  const originalStats = await fs.stat(params.inputPath);
  const originalSize = originalStats.size;
  const startTime = Date.now();
  const config: TranscodingConfig = {
    source: params.sourceEncoding,
    target: params.targetEncoding,
    mode: 'chunk'
  };

  try {
    await performTranscoding(params.inputPath, params.outputPath, config);
  } catch (error) {
    throw transcodingCodecError(
      `Chunk transcoding failed: ${error instanceof Error ? error.message : String(error)}`,
      params.sourceEncoding.codec,
      params.targetEncoding.codec
    );
  }

  const executionTime = Date.now() - startTime;
  const transcodedStats = await fs.stat(params.outputPath);
  const transcodedSize = transcodedStats.size;

  return {
    outputPath: params.outputPath,
    originalSize,
    transcodedSize,
    executionTime,
    sourceCodec: params.sourceEncoding.codec,
    targetCodec: params.targetEncoding.codec,
    config
  };
};

export const getRecommendedTargetCodec = (sourceCodec: string): string => {
  const compatibility = CODEC_COMPATIBILITY[sourceCodec as SourceCodec];
  if (!compatibility) {
    return DEFAULT_TARGET_CODEC;
  }

  return compatibility.recommended;
};

export const transcodingService = {
  transcodeChunk,
  getRecommendedTargetCodec
};

export type TranscodingService = typeof transcodingService;

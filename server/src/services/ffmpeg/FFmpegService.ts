import type { FFmpegExecutionResult, DecodeParams } from '../../types/ffmpeg/FFmpegTypes.js';
import {
  validateBitrate,
  validateChannels,
  validateCodec,
  validateFilePath,
  validateInputFile,
  validateOutputPath,
  validateSampleRate
} from '../../validator/ffmpeg/FFmpegValidator.js';
import { ffmpegFileError, ffmpegValidationError } from '../../errors/ffmpeg/FFmpegErrors.js';
import { ffmpegExecutor } from './implementations/FFmpegExecutor.js';
import {
  buildDecodeAdditionalArgs,
  buildDecodeCommandOptions,
  isRawCodec,
  normalizeDecodeCodec
} from '../../utils/ffmpeg/ffmpegServiceUtils.js';

const validateCommonParams = (inputPath: string, outputPath: string): void => {
  validateFilePath(inputPath, 'input');
  validateFilePath(outputPath, 'output');
};

const validateDecodeCodecRequirements = (codec: string, params: DecodeParams): void => {
  if (!isRawCodec(codec)) return;

  if (!params.sampleRate) {
    throw ffmpegValidationError(
      `Sample rate is required for ${codec} decoding`,
      'sampleRate'
    );
  }
  if (!params.channels) {
    throw ffmpegValidationError(
      `Channels are required for ${codec} decoding`,
      'channels'
    );
  }
  if (codec === 'g726' && !params.bitrate) {
    throw ffmpegValidationError(
      'Bitrate is required for G.726 decoding (8, 16, 24, or 32 kbps)',
      'bitrate'
    );
  }
};

const handleExecutionError = (error: unknown, inputPath: string): void => {
  if (error instanceof Error && error.message.includes('ENOENT')) {
    throw ffmpegFileError(
      `File not found: ${inputPath}`,
      inputPath
    );
  }
};

export const decode = async (params: DecodeParams): Promise<FFmpegExecutionResult> => {
  validateCommonParams(params.input.path, params.output.path);
  await validateInputFile(params.input.path);
  await validateOutputPath(params.output.path);
  let normalizedCodec = normalizeDecodeCodec(params.codec);
  // Defensive alias handling in service layer to avoid client-driven codec alias regressions.
  if (normalizedCodec === 'g711a' || normalizedCodec === 'alaw') normalizedCodec = 'pcm_alaw';
  if (normalizedCodec === 'g711u' || normalizedCodec === 'g711' || normalizedCodec === 'mulaw') normalizedCodec = 'pcm_mulaw';
  if (normalizedCodec) {
    validateCodec(normalizedCodec);
    validateDecodeCodecRequirements(normalizedCodec, params);
  }
  if (params.sampleRate) {
    validateSampleRate(params.sampleRate);
  }
  if (params.channels) {
    validateChannels(params.channels);
  }
  if (params.bitrate) {
    validateBitrate(params.bitrate);
  }
  const additionalArgs = buildDecodeAdditionalArgs({
    codec: normalizedCodec,
    sampleRate: params.sampleRate,
    channels: params.channels,
    bitrate: params.bitrate,
    inputFormat: params.input.format
  });

  const commandOptions = buildDecodeCommandOptions(
    params,
    normalizedCodec,
    additionalArgs
  );

  try {
    return await ffmpegExecutor.execute(commandOptions);
  } catch (error) {
    handleExecutionError(error, params.input.path);
    throw error;
  }
};

export const ffmpegService = {
  decode
};

export type FFmpegService = typeof ffmpegService;

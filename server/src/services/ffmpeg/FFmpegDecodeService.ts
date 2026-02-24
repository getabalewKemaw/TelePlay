import type { FFmpegExecutionResult, DecodeParams } from '../../types/ffmpeg/FFmpegTypes.js';
import { ffmpegFileError } from '../../errors/ffmpeg/FFmpegErrors.js';
import { ffmpegExecutor } from './FFmpegExecutor.js';
import { buildDecodeAdditionalArgs, buildDecodeCommandOptions } from '../../utils/ffmpeg/ffmpegServiceUtils.js';
import { normalizeAndValidateDecodeParams } from './FFmpegValidationService.js';

const handleExecutionError = (error: unknown, inputPath: string): void => {
  if (error instanceof Error && error.message.includes('ENOENT')) {
    throw ffmpegFileError(
      `File not found: ${inputPath}`,
      inputPath
    );
  }
};

export const decode = async (params: DecodeParams): Promise<FFmpegExecutionResult> => {
  const { normalizedCodec, validatedParams } = await normalizeAndValidateDecodeParams(params);

  const additionalArgs = buildDecodeAdditionalArgs({
    codec: normalizedCodec,
    sampleRate: validatedParams.sampleRate,
    channels: validatedParams.channels,
    bitrate: validatedParams.bitrate,
    inputFormat: validatedParams.input.format
  });

  const commandOptions = buildDecodeCommandOptions(
    validatedParams,
    normalizedCodec,
    additionalArgs
  );

  try {
    return await ffmpegExecutor.execute(commandOptions);
  } catch (error) {
    handleExecutionError(error, validatedParams.input.path);
    throw error;
  }
};

export const ffmpegDecodeService = {
  decode
};

export type FFmpegDecodeService = typeof ffmpegDecodeService;

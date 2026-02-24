import type { FFmpegExecutionResult, DecodeParams } from '../../types/ffmpeg/FFmpegTypes.js';
import { ffmpegDecodeService } from './FFmpegDecodeService.js';

export const decode = async (params: DecodeParams): Promise<FFmpegExecutionResult> => {
  return ffmpegDecodeService.decode(params);
};

export const ffmpegService = {
  decode
};

export type FFmpegService = typeof ffmpegService;

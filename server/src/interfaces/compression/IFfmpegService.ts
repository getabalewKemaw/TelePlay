
import type { FFmpegExecutionResult } from '../../types/ffmpeg/FFmpegTypes.js';
import type { EncodeParams } from '../../types/ffmpeg/FFmpegTypes.js';
export interface IFfmpegService {

  encode(params: EncodeParams): Promise<FFmpegExecutionResult>;

}

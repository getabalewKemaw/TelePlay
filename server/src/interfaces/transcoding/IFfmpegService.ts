
import type { FFmpegExecutionResult ,TranscodeParams} from '../../types/ffmpeg/FFmpegTypes.js';
export interface IFfmpegService {
  transcode(params: TranscodeParams): Promise<FFmpegExecutionResult>;

}

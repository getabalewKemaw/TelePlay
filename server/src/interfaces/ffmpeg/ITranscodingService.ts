/**
 * Transcoding Service Interface (for dependency injection)
 */



import type { TranscodingResult ,ChunkTranscodingParams} from '../../types/transcoding/TranscodingTypes.js';

export interface ITranscodingService {
  transcodeChunk(params: ChunkTranscodingParams): Promise<TranscodingResult>;
  getRecommendedTargetCodec(sourceCodec: string): string;
}

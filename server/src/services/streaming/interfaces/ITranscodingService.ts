/**
 * Transcoding Service Interface (for dependency injection)
 */

import type { TranscodingResult } from '../../transcoding/types/TranscodingTypes.js';
import type { ChunkTranscodingParams } from '../../transcoding/types/TranscodingTypes.js';

export interface ITranscodingService {
  transcodeChunk(params: ChunkTranscodingParams): Promise<TranscodingResult>;
  getRecommendedTargetCodec(sourceCodec: string): string;
}

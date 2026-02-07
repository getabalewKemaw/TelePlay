
import type { CompressionResult,
  CompressionOptions } from '../../types/compression/CompressionTypes.js';

export interface ICompressionService {
  compress(inputPath: string, options?: CompressionOptions): Promise<CompressionResult>;
}

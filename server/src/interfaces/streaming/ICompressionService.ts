/**
 * Compression Service Interface (for dependency injection)
 */

import type { CompressionResult } from '../../types/compression/CompressionTypes.js';

export interface ICompressionService {
  compress(inputPath: string, options?: any): Promise<CompressionResult>;
}

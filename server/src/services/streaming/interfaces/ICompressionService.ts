/**
 * Compression Service Interface (for dependency injection)
 */

import type { CompressionResult } from '../../compression/types/CompressionTypes.js';

export interface ICompressionService {
  compress(inputPath: string, options?: any): Promise<CompressionResult>;
}

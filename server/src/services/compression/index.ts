/**
 * Compression Service - Public API
 * Main entry point for Compression service
 */

export { CompressionService } from './CompressionService.js';

// Export presets
export { COMPRESSION_PRESETS, getPreset, getDefaultPreset } from './presets/CompressionPresets.js';

// Export interfaces
export type { ICompressionService } from './interfaces/ICompressionService.js';
export type { IFfmpegService } from './interfaces/IFfmpegService.js';

// Export types
export type {
  CompressionLevel,
  CompressionStrategy,
  CompressionMode,
  CompressionConfig,
  CompressionResult,
  CompressionOptions,
  CompressionPreset,
  CompressionMetrics,
  CompressionRecommendation
} from './types/CompressionTypes.js';

// Export errors
export {
  CompressionError,
  CompressionValidationError,
  CompressionFileError,
  CompressionOperationError,
  CompressionPresetError
} from './errors/CompressionErrors.js';

// Export validators
export { CompressionValidator } from './validators/CompressionValidator.js';

/**
 * Segmentation Service - Public API
 * Main entry point for Segmentation service
 */

export { SegmentationService } from './SegmentationService.js';

// Export strategies
export { FixedSegmentationStrategy } from './strategies/FixedSegmentationStrategy.js';
export { AdaptiveSegmentationStrategy } from './strategies/AdaptiveSegmentationStrategy.js';
export { ProgressiveSegmentationStrategy } from './strategies/ProgressiveSegmentationStrategy.js';
export { LowLatencySegmentationStrategy } from './strategies/LowLatencySegmentationStrategy.js';
export { SegmentationStrategyFactory } from './strategies/SegmentationStrategyFactory.js';

// Export interfaces
export type { ISegmentationService } from '../../interfaces/segementation/ISegmentationService.js';
export type { IChunkingService } from '../../interfaces/segementation/IChunkingService.js';
export type { ISegmentationStrategy } from './strategies/ISegmentationStrategy.js';

// Export types
export type {
  SegmentMetadata,
  SegmentationStrategy,
  SegmentationConfig,
  SegmentationResult,
  BufferingStrategy,
  PlaybackState,
  BufferingRecommendation,
  SegmentationOptions,
  StreamingMode,

} from '../../types/segementation/SegmentationTypes.js';

export { SegmentPriority } from '../../types/segementation/SegmentationTypes.js';

// Export errors
export {
  SegmentationError,
  SegmentationValidationError,
  SegmentationStrategyError,
  SegmentationBufferingError
} from '../../errors/segmentation/SegmentationErrors.js';


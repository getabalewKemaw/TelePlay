/**
 * Segmentation Strategy Factory
 * Creates appropriate strategy instances based on strategy type
 */

import type { ISegmentationStrategy } from './ISegmentationStrategy.js';
import type { SegmentationStrategy } from '../../../types/segmentation/SegmentationTypes.js';
import { FixedSegmentationStrategy } from './FixedSegmentationStrategy.js';
import { AdaptiveSegmentationStrategy } from './AdaptiveSegmentationStrategy.js';
import { ProgressiveSegmentationStrategy } from './ProgressiveSegmentationStrategy.js';
import { LowLatencySegmentationStrategy } from './LowLatencySegmentationStrategy.js';
import { SegmentationStrategyError } from '../../../errors/segmentation/SegmentationErrors.js';

/**
 * Factory for creating segmentation strategies
 */
export class SegmentationStrategyFactory {
  /**
   * Create a strategy instance based on strategy type
   */
  static create(strategy: SegmentationStrategy): ISegmentationStrategy {
    switch (strategy) {
      case 'fixed':
        return new FixedSegmentationStrategy();
      case 'adaptive':
        return new AdaptiveSegmentationStrategy();
      case 'progressive':
        return new ProgressiveSegmentationStrategy();
      case 'low-latency':
        return new LowLatencySegmentationStrategy();
      default:
        throw new SegmentationStrategyError(
          `Unknown segmentation strategy: ${strategy}`,
          strategy
        );
    }
  }

  /**
   * Get default strategy
   */
  static getDefault(): ISegmentationStrategy {
    return new AdaptiveSegmentationStrategy();
  }
}

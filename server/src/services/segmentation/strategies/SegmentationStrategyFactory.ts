/**
 * Creates appropriate strategy instances based on strategy type
 */

import type { ISegmentationStrategy } from './ISegmentationStrategy.js';
import type { SegmentationStrategy } from '../../../types/segmentation/SegmentationTypes.js';
import { createFixedSegmentationStrategy } from './FixedSegmentationStrategy.js';
import { createAdaptiveSegmentationStrategy } from './AdaptiveSegmentationStrategy.js';
import { createProgressiveSegmentationStrategy } from './ProgressiveSegmentationStrategy.js';
import { createLowLatencySegmentationStrategy } from './LowLatencySegmentationStrategy.js';
import { createSegmentationStrategyError } from '../../../errors/segmentation/SegmentationErrors.js';

/**
 * Factory for creating segmentation strategies
 */
export const createSegmentationStrategyFactory = () => {
  const create = (strategy: SegmentationStrategy): ISegmentationStrategy => {
    switch (strategy) {
      case 'fixed':
        return createFixedSegmentationStrategy();
      case 'adaptive':
        return createAdaptiveSegmentationStrategy();
      case 'progressive':
        return createProgressiveSegmentationStrategy();
      case 'low-latency':
        return createLowLatencySegmentationStrategy();
      default:
        throw createSegmentationStrategyError(
          `Unknown segmentation strategy: ${strategy}`,
          strategy
        );
    }
  };

  const getDefault = (): ISegmentationStrategy => createAdaptiveSegmentationStrategy();

  return {
    create,
    getDefault
  };
};

export type SegmentationStrategyFactory = ReturnType<typeof createSegmentationStrategyFactory>;

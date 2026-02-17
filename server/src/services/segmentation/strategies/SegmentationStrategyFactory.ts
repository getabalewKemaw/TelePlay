/**
 * Creates appropriate strategy instances based on strategy type
 */

import type { ISegmentationStrategy } from './ISegmentationStrategy.js';
import type { SegmentationStrategy } from '../../../types/segmentation/SegmentationTypes.js';
import { createSegments as createFixedSegments } from './FixedSegmentationStrategy.js';
import { createSegments as createAdaptiveSegments } from './AdaptiveSegmentationStrategy.js';
import { createSegments as createProgressiveSegments } from './ProgressiveSegmentationStrategy.js';
import { createSegments as createLowLatencySegments } from './LowLatencySegmentationStrategy.js';
import { createSegmentationStrategyError } from '../../../errors/segmentation/SegmentationErrors.js';

export const createStrategy = (strategy: SegmentationStrategy): ISegmentationStrategy => {
  switch (strategy) {
    case 'fixed':
      return {
        getName: () => 'fixed',
        createSegments: createFixedSegments
      };
    case 'adaptive':
      return {
        getName: () => 'adaptive',
        createSegments: createAdaptiveSegments
      };
    case 'progressive':
      return {
        getName: () => 'progressive',
        createSegments: createProgressiveSegments
      };
    case 'low-latency':
      return {
        getName: () => 'low-latency',
        createSegments: createLowLatencySegments
      };
    default:
      throw createSegmentationStrategyError(
        `Unknown segmentation strategy: ${strategy}`,
        strategy
      );
  }
};

export const getDefaultStrategy = (): ISegmentationStrategy => ({
  getName: () => 'adaptive',
  createSegments: createAdaptiveSegments
});

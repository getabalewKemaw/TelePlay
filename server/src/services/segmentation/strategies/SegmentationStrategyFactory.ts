/**
 * Creates appropriate strategy instances based on strategy type
 */

import type { ISegmentationStrategy } from './ISegmentationStrategy.js';
import type { SegmentationStrategy } from '../../../types/segmentation/SegmentationTypes.js';
import { createSegments as createAdaptiveSegments } from './AdaptiveSegmentationStrategy.js';
import { segmentationStrategyError } from '../../../errors/segmentation/SegmentationErrors.js';

export const createStrategy = (strategy: SegmentationStrategy): ISegmentationStrategy => {
  switch (strategy) {
    case 'adaptive':
      return {
        getName: () => 'adaptive',
        createSegments: createAdaptiveSegments
      };
    default:
      throw segmentationStrategyError(
        `Unknown segmentation strategy: ${strategy}`,
        strategy
      );
  }
};

export const getDefaultStrategy = (): ISegmentationStrategy => ({
  getName: () => 'adaptive',
  createSegments: createAdaptiveSegments
});

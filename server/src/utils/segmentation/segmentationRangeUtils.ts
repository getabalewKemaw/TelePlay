import type { SegmentMetadata } from '../../types/segmentation/SegmentationTypes.js';
import { createSegmentationValidationError } from '../../errors/segmentation/SegmentationErrors.js';

export function validateTimeRange(startTime: number, endTime: number): void {
  const values = [startTime, endTime];
  if (values.some((value) => !Number.isFinite(value)) || startTime < 0 || endTime <= startTime) {
    throw createSegmentationValidationError(
      `Invalid segment range: start=${startTime}, end=${endTime}`,
      'timeRange'
    );
  }
}

export function isSegmentInRange(segment: SegmentMetadata, startTime: number, endTime: number): boolean {
  return (
    (segment.startTime >= startTime && segment.startTime < endTime) ||
    (segment.endTime > startTime && segment.endTime <= endTime) ||
    (segment.startTime <= startTime && segment.endTime >= endTime)
  );
}


export type SegmentationError = Error & {
  code: string;
  cause?: Error;
};

export type SegmentationValidationError = SegmentationError & {
  field?: string;
};
export type SegmentationStrategyError = SegmentationError & {
  strategy: string;
};


const segmentationBaseError = <T extends object>(
  name: string,
  message: string,
  code: string,
  extras?: T,
  cause?: Error
): SegmentationError & T => {
  const error = new Error(message) as SegmentationError & T;
  error.name = name;
  error.code = code;
  if (cause) {
    error.cause = cause;
  }
  if (extras) {
    Object.assign(error, extras);
  }
  if (Error.captureStackTrace) {
    Error.captureStackTrace(error, segmentationBaseError);
  }
  return error;
};

export const segmentationValidationError = (
  message: string,
  field?: string
): SegmentationValidationError => (
  segmentationBaseError('SegmentationValidationError', message, 'VALIDATION_ERROR', { field })
);

/**
 * Strategy error - thrown when segmentation strategy fails
 */
export const segmentationStrategyError = (
  message: string,
  strategy: string
): SegmentationStrategyError => (
  segmentationBaseError('SegmentationStrategyError', message, 'STRATEGY_ERROR', { strategy })
);


export class CompressionError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'CompressionError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class CompressionValidationError extends CompressionError {
  constructor(message: string, public readonly field?: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'CompressionValidationError';
  }
}

export class CompressionFileError extends CompressionError {
  constructor(message: string, public readonly filePath: string) {
    super(message, 'FILE_ERROR');
    this.name = 'CompressionFileError';
  }
}

export class CompressionOperationError extends CompressionError {
  constructor(
    message: string,
    public readonly inputPath: string,
    public readonly outputPath: string
  ) {
    super(message, 'OPERATION_ERROR');
    this.name = 'CompressionOperationError';
  }
}

/**
 * Preset error - thrown when preset operations fail
 */
export class CompressionPresetError extends CompressionError {
  constructor(message: string, public readonly presetName: string) {
    super(message, 'PRESET_ERROR');
    this.name = 'CompressionPresetError';
  }
}

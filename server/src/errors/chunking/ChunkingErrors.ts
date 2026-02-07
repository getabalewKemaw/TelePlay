
export class ChunkingError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'ChunkingError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error - thrown when input parameters are invalid
 */
export class ChunkingValidationError extends ChunkingError {
  constructor(message: string, public readonly field?: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ChunkingValidationError';
  }
}

/**
 * File error - thrown when file operations fail
 */
export class ChunkingFileError extends ChunkingError {
  constructor(message: string, public readonly filePath: string) {
    super(message, 'FILE_ERROR');
    this.name = 'ChunkingFileError';
  }
}

/**
 * Metadata error - thrown when metadata retrieval fails
 */
export class ChunkingMetadataError extends ChunkingError {
  constructor(message: string, public readonly filePath: string) {
    super(message, 'METADATA_ERROR');
    this.name = 'ChunkingMetadataError';
  }
}

/**
 * Seek error - thrown when seek operation fails
 */
export class ChunkingSeekError extends ChunkingError {
  constructor(message: string, public readonly time: number) {
    super(message, 'SEEK_ERROR');
    this.name = 'ChunkingSeekError';
  }
}


/**
 * Shared Base Response for all API responses
 */
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: ApiErrorResponse;
    meta?: ResponseMetadata;
}

export interface ApiErrorResponse {
    code: string;
    message: string;
    details?: unknown;
    traceId?: string;
}

export interface ResponseMetadata {
    timestamp: string;
    version: string;
    processingTimeMs?: number;
}
export enum ApiErrorCode {
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    NOT_FOUND = 'NOT_FOUND',
    FFMPEG_ERROR = 'FFMPEG_ERROR',
    INTERNAL_ERROR = 'INTERNAL_ERROR',
    UNAUTHORIZED = 'UNAUTHORIZED',
    TIMEOUT = 'TIMEOUT'
}

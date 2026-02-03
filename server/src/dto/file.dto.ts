import type { ApiResponse } from './base.dto.js';

export interface FileMetadataDto {
    id: string;
    filename: string;
    originalPath: string;
    duration: number;
    fileSize: string; // BigInt as string for JSON
    format?: string;
    codec?: string;
    bitrate?: number;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export interface ListFilesRequestDto {
    query?: string;
    sort?: string;
    order?: 'asc' | 'desc';
    page?: number;
    limit?: number;
}

export interface ListFilesResponseDto extends ApiResponse<FileMetadataDto[]> {
    meta: {
        total: number;
        page: number;
        limit: number;
        timestamp: string;
        version: string;
    };
}

export interface UploadFileResponseDto extends ApiResponse<FileMetadataDto> { }

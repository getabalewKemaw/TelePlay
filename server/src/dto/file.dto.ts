export interface FileMetadataDto {
    id: string;
    filename: string;
    originalPath: string;
    decodedPath?: string | null;
    duration: number;
    fileSize?: string; // BigInt as string for JSON
    format?: string;
    codec?: string;
    bitrate?: number;
    status: string;
    decodeProgress?: number;
    metadata?: unknown;
    createdAt: string | Date;
    updatedAt: string | Date;
}

export interface ListFilesRequestDto {
    query?: string;
    sort?: string;
    order?: 'asc' | 'desc';
    page?: number;
    limit?: number;
    decodedOnly?: boolean;
}

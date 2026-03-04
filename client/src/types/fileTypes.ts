export interface MediaFile {
    id: string;
    filename: string;
    originalPath: string;
    decodedPath?: string;
    status: string;
    duration: number;
    decodeProgress?: number;
    format?: string;
    codec?: string;
    bitrate?: number;
    fileSize?:number
}
export interface FetchFilesParams {
    page?: number;
    limit?: number;
    query?: string;
    sort?: string;
    order?: 'asc' | 'desc';
    decodedOnly?: boolean;
}

export interface FetchFilesResult {
    files: MediaFile[];
    meta?: {
        total?: number;
        page?: number | null;
        limit?: number | null;
    };
}


export interface DecodeFileTypes{
     fileId?: string;
    input: { path: string; format?: string };
    output: { path: string; format: string };
    codec?: string;
    sampleRate?: number;
    channels?: number;
    bitrate?: number;
}
export interface TranscodeFileTypes{
      fileId?: string;
    input: { path: string; format?: string };
    output: { path: string; format?: string };
    sourceEncoding: { codec: string; sampleRate: number; channels: number; bitrate?: number };
    targetEncoding: { codec: string; sampleRate: number; channels: number; bitrate?: number };

}
export interface TranscodeFileDownloadTypes{
   input: { path: string; format?: string };
    output: { path: string; format?: string };
    sourceEncoding: { codec: string; sampleRate: number; channels: number; bitrate?: number };
    targetEncoding: { codec: string; sampleRate: number; channels: number; bitrate?: number };
}
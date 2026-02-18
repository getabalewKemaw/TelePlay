import axios from 'axios';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL 
  ? `${import.meta.env.VITE_API_BASE_URL}/api` 
  : 'http://localhost:3000/api';
const api = axios.create({
    baseURL: API_BASE_URL,
});

export interface MediaFile {
    id: string;
    filename: string;
    originalPath: string;
    decodedPath?: string;
    status: string;
    decodeProgress?: number;
    duration: number;
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

export const fetchFiles = async (params: FetchFilesParams = {}): Promise<FetchFilesResult> => {
    const response = await api.get('/files', { params });
    return {
        files: Array.isArray(response.data?.data) ? response.data.data : [],
        meta: response.data?.meta
    };
};

export const decodeFile = async (data: {
    fileId?: string;
    input: { path: string; format?: string };
    output: { path: string; format: string };
    codec?: string;
    sampleRate?: number;
    channels?: number;
    bitrate?: number;
}) => {
    try {
        const response = await api.post('/ffmpeg/decode', data);
        return response.data.data;
    } catch (error: any) {
        const status = error?.response?.status;
        const payload = error?.response?.data;
        if (status === 409 && payload?.data?.outputPath) {
            return { outputPath: payload.data.outputPath, alreadyDecoded: true };
        }
        throw error;
    }
};

export const transcodeFile = async (data: {
    fileId?: string;
    input: { path: string; format?: string };
    output: { path: string; format?: string };
    sourceEncoding: { codec: string; sampleRate: number; channels: number; bitrate?: number };
    targetEncoding: { codec: string; sampleRate: number; channels: number; bitrate?: number };
}) => {
    const response = await api.post('/transcoding/convert', data);
    return response.data.data;
};

export const transcodeFileDownload = async (data: {
    input: { path: string; format?: string };
    output: { path: string; format?: string };
    sourceEncoding: { codec: string; sampleRate: number; channels: number; bitrate?: number };
    targetEncoding: { codec: string; sampleRate: number; channels: number; bitrate?: number };
}) => {
    const response = await api.post('/transcoding/convert-download', data, { responseType: 'blob' });
    return response;
};
export const createStreamingSession = async (filePath: string, options?: any) => {
    const response = await api.post('/streaming/sessions', {
        filePath,
        options: options || {
            transport: 'http',
            mode: 'file-based'
        }
    });
    return response.data.data;
};

export const fetchStreamingChunks = async (sessionId: string) => {
    const response = await api.get(`/streaming/sessions/${sessionId}/chunks`);
    return response.data.data;
};

export const fetchStreamingSegments = async (sessionId: string) => {
    const response = await api.get(`/streaming/sessions/${sessionId}/segments`);
    return response.data.data;
};

export const fetchStreamingChunkPeaks = async (sessionId: string, index: number, bins: number) => {
    const response = await api.get(`/streaming/sessions/${sessionId}/chunks/${index}/peaks`, {
        params: { bins }
    });
    return response.data.data;
};

export const fetchStreamingChunkByTime = async (sessionId: string, time: number) => {
    const response = await api.get(`/streaming/sessions/${sessionId}/chunks/by-time`, {
        params: { time }
    });
    return response.data.data;
};

export const discoverFiles = async (path?: string) => {
    const response = await api.post('/files/discover', { path });
    return response.data;

};

export const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    // axios automatically sets Content-Type to multipart/form-data
    const response = await api.post('/files/upload', formData);
    return response.data;
};

export default api;

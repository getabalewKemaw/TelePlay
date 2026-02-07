import axios from 'axios';
const API_BASE_URL = 'http://localhost:3000/api';
const api = axios.create({
    baseURL: API_BASE_URL,
});
export interface MediaFile {
    id: string;
    filename: string;
    originalPath: string;
    decodedPath?: string;
    status: string;
    duration: number;
    format?: string;
    codec?: string;
    bitrate?: number;
    fileSize?:number
}

export const fetchFiles = async () => {
    const response = await api.get('/files');
    return response.data.data;
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

export const discoverFiles = async (path?: string) => {
    const response = await api.post('/discover', { path });
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

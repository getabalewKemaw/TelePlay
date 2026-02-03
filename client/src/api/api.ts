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
}

export const fetchFiles = async () => {
    const response = await api.get('/files');
    return response.data.data;
};

export const decodeFile = async (data: {
    fileId?: string;
    input: { path: string; format?: string };
    output: { path: string; format: string };
    codec: string;
    sampleRate: number;
    channels: number;
    bitrate?: number;
}) => {
    const response = await api.post('/ffmpeg/decode', data);
    return response.data.data;
};

export const createStreamingSession = async (filePath: string) => {
    const response = await api.post('/streaming/sessions', {
        filePath,
        options: {
            transport: 'http',
            mode: 'file-based'
        }
    });
    return response.data.data;
};
export default api;

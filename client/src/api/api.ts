import axios from 'axios';
import { API_BASE_URL } from '../constants/constants';
import type { 
     DecodeFileTypes,
     TranscodeFileTypes,
     TranscodeFileDownloadTypes,
     FetchFilesParams,
     FetchFilesResult
    } from '../types/fileTypes';
const api = axios.create({
    baseURL: API_BASE_URL,
});

export const fetchFiles = async (params: FetchFilesParams = {}): Promise<FetchFilesResult> => {
    const response = await api.get('/files', { params });
    return {
        files: Array.isArray(response.data?.data) ? response.data.data : [],
        meta: response.data?.meta
    };
};

export const decodeFile = async (data: DecodeFileTypes) => {
    try {
        const response = await api.post('/ffmpeg/decode', data);
        return response.data.data;
    } catch (error: any) {
        const status = error?.response?.status;
        const payload = error?.response?.data;
        //if 409 with outpath so the server detects a conflict and so it is aleadly decoded so we can return it 
        if (status === 409 && payload?.data?.outputPath) {
            return { outputPath: payload.data.outputPath, alreadyDecoded: true };
        }
        throw error;
    }
};
export const transcodeFile = async (data: TranscodeFileTypes) => {
    try{
    const response = await api.post('/transcoding/convert', data);
    return response.data.data;
    }catch(error:any){
       console.log("can not trancode file right now Pls try again",error.message);
    }
};
export const transcodeFileDownload = async (data: TranscodeFileDownloadTypes) => {
    try {
    const response = await api.post('/transcoding/convert-download', data, { responseType: 'blob' });
    return response;
    } catch (error:any) {
        console.log("Something went wron when convering a file :",error.message!)
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

export const fetchStreamingChunks = async (sessionId: string) => {
    try {
         const response = await api.get(`/streaming/sessions/${sessionId}/chunks`);
        return response.data.data;    
    } catch (error:any) {
        console.log("Error fetching streaming chunks",error.message) 
    }
   
};
export const fetchStreamingSegments = async (sessionId: string) => {
    try {
           const response = await api.get(`/streaming/sessions/${sessionId}/segments`);
         return response.data.data;
        
    } catch (error:any) {
        console.log("error fetching the streaming segments",error.message)
    }
 
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

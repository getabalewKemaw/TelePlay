import axios from 'axios';
import { API_BASE_URL } from '../constants/constants';
import type {
  DecodeFileTypes,
  TranscodeFileTypes,
  TranscodeFileDownloadTypes,
  FetchFilesParams,
  FetchFilesResult
} from '../types/fileTypes';
import { onApiNetworkStatusChange, setupApiNetworkInterceptors } from './networkError';
export type { MediaFile } from '../types/fileTypes';
export { onApiNetworkStatusChange };

const isProduction = import.meta.env.PROD;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: isProduction ? 15000 : 0
});

setupApiNetworkInterceptors(api, isProduction);

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
    const status = error?.status;
    const payload = error?.responseData;
    if (status === 409 && payload?.data?.outputPath) {
      return { outputPath: payload.data.outputPath, alreadyDecoded: true };
    }
    throw error;
  }
};

export const transcodeFile = async (data: TranscodeFileTypes) => {
  const response = await api.post('/transcoding/convert', data);
  return response.data.data;
};

export const transcodeFileDownload = async (data: TranscodeFileDownloadTypes) => {
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

export const discoverFiles = async (directoryPath?: string) => {
  const response = await api.post('/files/discover', { path: directoryPath });
  return response.data;
};

export const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/files/upload', formData);
  return response.data;
};

export const checkServerHealth = async (): Promise<boolean> => {
  try {
    await api.get('/health');
    return true;
  } catch {
    return false;
  }
};

export default api;

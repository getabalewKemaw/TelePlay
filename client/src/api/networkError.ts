import type { AxiosError, AxiosInstance } from 'axios';

export type NetworkIssueCode =
  | 'NETWORK_OFFLINE'
  | 'SERVER_UNREACHABLE'
  | 'REQUEST_TIMEOUT'
  | 'HTTP_5XX'
  | 'NONE';

export class ApiClientError extends Error {
  code: NetworkIssueCode;
  status?: number;
  retryable: boolean;
  responseData?: unknown;

  constructor(message: string, code: NetworkIssueCode, retryable: boolean, status?: number, responseData?: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.retryable = retryable;
    this.status = status;
    this.responseData = responseData;
  }
}

type NetworkIssueListener = (issue: NetworkIssueCode) => void;
const listeners = new Set<NetworkIssueListener>();

export const onApiNetworkStatusChange = (listener: NetworkIssueListener): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const notifyNetworkIssue = (issue: NetworkIssueCode): void => {
  for (const listener of listeners) {
    listener(issue);
  }
};

const toApiClientError = (error: unknown): ApiClientError => {
  const axiosError = error as AxiosError<any>;
  const status = axiosError?.response?.status;
  const responseData = axiosError?.response?.data;

  if (!navigator.onLine) {
    return new ApiClientError('No internet connection.', 'NETWORK_OFFLINE', true);
  }
  if (axiosError?.code === 'ECONNABORTED') {
    return new ApiClientError('Request timed out.', 'REQUEST_TIMEOUT', true, status, responseData);
  }
  if (!status) {
    return new ApiClientError('Cannot reach server.', 'SERVER_UNREACHABLE', true);
  }
  if (status >= 500) {
    return new ApiClientError('Server error occurred.', 'HTTP_5XX', true, status, responseData);
  }
  return new ApiClientError(axiosError?.message || 'Request failed.', 'NONE', false, status, responseData);
};

export const setupApiNetworkInterceptors = (api: AxiosInstance, isProduction: boolean): void => {
  api.interceptors.response.use(
    (response) => {
      if (isProduction) {
        notifyNetworkIssue('NONE');
      }
      return response;
    },
    (error) => {
      const mapped = toApiClientError(error);
      if (isProduction) {
        notifyNetworkIssue(mapped.code);
      }
      return Promise.reject(mapped);
    }
  );
};

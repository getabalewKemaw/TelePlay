export type HttpError = Error & {
  status: number;
  code?: string;
};

const buildHttpError = (message: string, status: number, code?: string): HttpError => {
  const error = new Error(message) as HttpError;
  error.status = status;
  if (code) {
    error.code = code;
  }
  return error;
};

export const badRequestError = (message: string, code?: string): HttpError => (
  buildHttpError(message, 400, code)
);

export const notFoundError = (message: string, code?: string): HttpError => (
  buildHttpError(message, 404, code)
);

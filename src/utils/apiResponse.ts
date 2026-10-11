import { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: unknown;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const sendSuccess = <T>(
  res: Response,
  data?: T,
  message?: string,
  statusCode: number = 200,
  pagination?: ApiResponse['pagination']
): Response => {
  const responsePayload: ApiResponse<T> = {
    success: true,
    ...(data !== undefined ? { data } : {}),
    ...(message ? { message } : {}),
    ...(pagination ? { pagination } : {})
  };
  return res.status(statusCode).json(responsePayload);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode: number = 500,
  errors?: unknown
): Response => {
  const responsePayload: ApiResponse = {
    success: false,
    message,
    ...(errors ? { errors } : {})
  };
  return res.status(statusCode).json(responsePayload);
};

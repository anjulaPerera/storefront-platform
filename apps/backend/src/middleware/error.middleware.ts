import { Request, Response, NextFunction } from "express";

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorMiddleware(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const statusCode = err.statusCode ?? 500;
  const code = err.code ?? "INTERNAL_ERROR";

  console.error(`[ERROR] ${code}: ${err.message}`);

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message:
        statusCode === 500 ? "An unexpected error occurred" : err.message,
    },
  });
}

export function createError(
  message: string,
  statusCode: number,
  code: string,
): AppError {
  const err: AppError = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  return err;
}

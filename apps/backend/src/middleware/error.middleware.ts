import { Request, Response, NextFunction } from "express";
import multer from "multer";

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
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        res.status(400).json({
          success: false,
          error: {
            code: "INVALID_FILE",
            message: err.message,
          },
        });
        return;
      }
    }
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

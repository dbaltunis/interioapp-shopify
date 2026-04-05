import type { Request, Response, NextFunction } from "express";

/**
 * Custom error class with HTTP status code support.
 */
export class AppError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode = 500, code = "INTERNAL_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, 404, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class AuthError extends AppError {
  constructor(message = "Authentication required") {
    super(message, 401, "AUTH_ERROR");
    this.name = "AuthError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Access denied") {
    super(message, 403, "FORBIDDEN");
    this.name = "ForbiddenError";
  }
}

/**
 * Central error handler middleware.
 * Classifies errors and returns appropriate HTTP status codes.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  // Determine status code and error code
  let statusCode = 500;
  let code = "INTERNAL_ERROR";
  let message = "Internal server error";

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
  } else if (err.name === "SyntaxError" && "body" in err) {
    // JSON parse error from express.json()
    statusCode = 400;
    code = "INVALID_JSON";
    message = "Invalid JSON in request body";
  } else if (err.message) {
    message = err.message;
  }

  // Log server errors (5xx) with stack trace
  if (statusCode >= 500) {
    console.error(`[${code}] ${message}`, err.stack || "");
  } else {
    console.warn(`[${code}] ${message}`);
  }

  // Don't expose internal error details in production
  const isProduction = process.env.NODE_ENV === "production";
  const responseMessage = isProduction && statusCode >= 500
    ? "Internal server error"
    : message;

  res.status(statusCode).json({
    error: responseMessage,
    code,
  });
}

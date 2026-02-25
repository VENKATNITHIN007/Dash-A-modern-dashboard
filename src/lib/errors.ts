import "server-only";

export class ApiError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public type: string = "https://example.com/probs/internal-server-error",
    public title: string = "Internal Server Error"
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = "Resource not found") {
    super(
      message,
      404,
      "https://example.com/probs/not-found",
      "Not Found"
    );
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = "Authentication required") {
    super(
      message,
      401,
      "https://example.com/probs/unauthorized",
      "Unauthorized"
    );
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = "Access denied") {
    super(
      message,
      403,
      "https://example.com/probs/forbidden",
      "Forbidden"
    );
  }
}

export interface ValidationErrorDetail {
  field: string;
  message: string;
}

export class ValidationError extends ApiError {
  constructor(
    message: string = "Validation failed",
    public details: ValidationErrorDetail[] = []
  ) {
    super(
      message,
      400,
      "https://example.com/probs/validation-error",
      "Validation Error"
    );
  }
}

import { NextResponse } from "next/server";
import { ApiError, ValidationError } from "./errors";

export function errorResponse(error: unknown) {
  if (error instanceof ApiError) {
    const body: Record<string, unknown> = {
      type: error.type,
      title: error.title,
      status: error.statusCode,
      detail: error.message,
    };

    if (error instanceof ValidationError && error.details.length > 0) {
      body.errors = error.details;
    }

    return NextResponse.json(body, { status: error.statusCode });
  }

  // Fallback for unknown errors
  return NextResponse.json(
    {
      type: "https://example.com/probs/internal-server-error",
      title: "Internal Server Error",
      status: 500,
      detail: error instanceof Error ? error.message : "An unexpected error occurred",
    },
    { status: 500 }
  );
}

export function notFoundError(message: string = "Resource not found") {
  return errorResponse(new ApiError(message, 404, "https://example.com/probs/not-found", "Not Found"));
}

export function unauthorizedError(message: string = "Authentication required") {
  return errorResponse(new ApiError(message, 401, "https://example.com/probs/unauthorized", "Unauthorized"));
}

export function forbiddenError(message: string = "Access denied") {
  return errorResponse(new ApiError(message, 403, "https://example.com/probs/forbidden", "Forbidden"));
}

export function validationError(details: { field: string; message: string }[]) {
  return errorResponse(new ValidationError("Validation failed", details));
}

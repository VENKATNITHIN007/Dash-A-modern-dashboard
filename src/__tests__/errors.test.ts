import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { 
  ApiError, 
  NotFoundError, 
  UnauthorizedError, 
  ForbiddenError, 
  ValidationError 
} from "@/lib/errors";
import { 
  errorResponse, 
  notFoundError, 
  unauthorizedError, 
  forbiddenError, 
  validationError 
} from "@/lib/api-response";

describe("Error Utilities", () => {
  describe("Custom Error Classes", () => {
    it("ApiError should have correct properties", () => {
      const error = new ApiError("Test message", 418, "http://err.com", "Teapot");
      expect(error.message).toBe("Test message");
      expect(error.statusCode).toBe(418);
      expect(error.type).toBe("http://err.com");
      expect(error.title).toBe("Teapot");
      expect(error.name).toBe("ApiError");
    });

    it("NotFoundError should have 404 status", () => {
      const error = new NotFoundError("Not found");
      expect(error.statusCode).toBe(404);
      expect(error.title).toBe("Not Found");
    });

    it("UnauthorizedError should have 401 status", () => {
      const error = new UnauthorizedError();
      expect(error.statusCode).toBe(401);
      expect(error.title).toBe("Unauthorized");
    });

    it("ForbiddenError should have 403 status", () => {
      const error = new ForbiddenError();
      expect(error.statusCode).toBe(403);
      expect(error.title).toBe("Forbidden");
    });

    it("ValidationError should include details", () => {
      const details = [{ field: "email", message: "Invalid" }];
      const error = new ValidationError("Bad input", details);
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual(details);
    });
  });

  describe("API Response Utilities", () => {
    it("errorResponse should format ApiError correctly", async () => {
      const error = new ApiError("Failed", 502, "type", "title");
      const response = errorResponse(error);
      
      expect(response.status).toBe(502);
      const data = await response.json() as any;
      expect(data).toEqual({
        type: "type",
        title: "title",
        status: 502,
        detail: "Failed",
      });
    });

    it("errorResponse should include validation details", async () => {
      const details = [{ field: "name", message: "Required" }];
      const error = new ValidationError("Validation failed", details);
      const response = errorResponse(error);
      
      const data = await response.json() as any;
      expect(data.errors).toEqual(details);
    });

    it("errorResponse should handle unknown errors", async () => {
      const error = new Error("Unexpected");
      const response = errorResponse(error);
      
      expect(response.status).toBe(500);
      const data = await response.json() as any;
      expect(data.title).toBe("Internal Server Error");
      expect(data.detail).toBe("Unexpected");
    });

    it("notFoundError helper should return 404 response", async () => {
      const response = notFoundError("Missing");
      expect(response.status).toBe(404);
      const data = await response.json() as any;
      expect(data.detail).toBe("Missing");
    });

    it("unauthorizedError helper should return 401 response", async () => {
      const response = unauthorizedError("Auth failed");
      expect(response.status).toBe(401);
      const data = await response.json() as any;
      expect(data.title).toBe("Unauthorized");
      expect(data.detail).toBe("Auth failed");
    });

    it("forbiddenError helper should return 403 response", async () => {
      const response = forbiddenError("No entry");
      expect(response.status).toBe(403);
      const data = await response.json() as any;
      expect(data.title).toBe("Forbidden");
      expect(data.detail).toBe("No entry");
    });

    it("validationError helper should return 400 response with details", async () => {
      const details = [{ field: "foo", message: "bar" }];
      const response = validationError(details);
      expect(response.status).toBe(400);
      const data = await response.json() as any;
      expect(data.errors).toEqual(details);
    });
  });
});

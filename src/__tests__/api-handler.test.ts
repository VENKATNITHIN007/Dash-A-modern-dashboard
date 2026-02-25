import { NextRequest } from "next/server";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { withApiAuth } from "@/lib/api-handler";
import { getSession } from "@/lib/auth";
import { ApiError, ValidationError } from "@/lib/errors";
import { createTenantClient } from "@/lib/tenant";

// Mock dependencies
vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/tenant", () => ({
  createTenantClient: vi.fn(),
}));

describe("withApiAuth", () => {
  const mockRequest = new NextRequest("http://localhost:3000/api/test");
  const mockContext = { params: Promise.resolve({ id: "123" }) };
  const mockDb = { organization: { findUnique: vi.fn() } };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createTenantClient).mockReturnValue(mockDb as any);
  });

  it("should return 401 Unauthorized if no session is found", async () => {
    vi.mocked(getSession).mockResolvedValue(null);

    const handler = vi.fn();
    const wrappedHandler = withApiAuth(handler);

    const response = await wrappedHandler(mockRequest, mockContext);
    
    expect(response.status).toBe(401);
    expect(response.headers.get("Content-Type")).toBe("application/problem+json");
    
    const data = await response.json();
    expect(data).toMatchObject({
      status: 401,
      title: "Unauthorized",
      type: "https://example.com/probs/unauthorized",
      detail: "Authentication required",
    });
    
    expect(handler).not.toHaveBeenCalled();
  });

  it("should return 403 Forbidden if user has no orgId", async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { id: "user-1", email: "test@example.com", name: "Test User", role: "admin", orgId: "" },
      session: { id: "session-1", expiresAt: new Date() },
    });

    const handler = vi.fn();
    const wrappedHandler = withApiAuth(handler);

    const response = await wrappedHandler(mockRequest, mockContext);
    
    expect(response.status).toBe(403);
    
    const data = await response.json();
    expect(data).toMatchObject({
      status: 403,
      title: "Forbidden",
      type: "https://example.com/probs/forbidden",
      detail: "User is not associated with an organization",
    });
    
    expect(handler).not.toHaveBeenCalled();
  });

  it("should call handler with context when session is valid", async () => {
    const mockSessionData = {
      user: { id: "user-1", email: "test@example.com", name: "Test User", role: "admin" as const, orgId: "org-1" },
      session: { id: "session-1", expiresAt: new Date() },
    };
    
    vi.mocked(getSession).mockResolvedValue(mockSessionData);

    const handler = vi.fn().mockResolvedValue(new Response("OK"));
    const wrappedHandler = withApiAuth<{ id: string }>(handler);

    const response = await wrappedHandler(mockRequest, mockContext);
    
    expect(response.status).toBe(200);
    
    expect(createTenantClient).toHaveBeenCalledWith("org-1");
    expect(handler).toHaveBeenCalledWith(mockRequest, {
      user: mockSessionData.user,
      session: mockSessionData.session,
      orgId: "org-1",
      db: mockDb,
      params: { id: "123" },
    });
  });

  it("should return RFC 7807 response for ApiError thrown in handler", async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { id: "user-1", email: "test@example.com", name: "Test User", role: "admin", orgId: "org-1" },
      session: { id: "session-1", expiresAt: new Date() },
    });

    const handler = vi.fn().mockRejectedValue(new ApiError("Custom error", 400, "https://example.com/probs/custom", "Custom Error"));
    const wrappedHandler = withApiAuth(handler);

    const response = await wrappedHandler(mockRequest, mockContext);
    
    expect(response.status).toBe(400);
    expect(response.headers.get("Content-Type")).toBe("application/problem+json");
    
    const data = await response.json();
    expect(data).toMatchObject({
      status: 400,
      title: "Custom Error",
      type: "https://example.com/probs/custom",
      detail: "Custom error",
    });
  });

  it("should return RFC 7807 response with details for ValidationError", async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { id: "user-1", email: "test@example.com", name: "Test User", role: "admin", orgId: "org-1" },
      session: { id: "session-1", expiresAt: new Date() },
    });

    const validationError = new ValidationError("Invalid data", [{ field: "email", message: "Invalid email" }]);
    const handler = vi.fn().mockRejectedValue(validationError);
    const wrappedHandler = withApiAuth(handler);

    const response = await wrappedHandler(mockRequest, mockContext);
    
    expect(response.status).toBe(400);
    
    const data = await response.json();
    expect(data).toMatchObject({
      status: 400,
      title: "Validation Error",
      type: "https://example.com/probs/validation-error",
      detail: "Invalid data",
      errors: [{ field: "email", message: "Invalid email" }],
    });
  });

  it("should return 500 RFC 7807 response for generic unhandled errors", async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { id: "user-1", email: "test@example.com", name: "Test User", role: "admin", orgId: "org-1" },
      session: { id: "session-1", expiresAt: new Date() },
    });

    // Mock console.error to avoid noisy test output
    vi.spyOn(console, "error").mockImplementation(() => {});

    const handler = vi.fn().mockRejectedValue(new Error("Something exploded"));
    const wrappedHandler = withApiAuth(handler);

    const response = await wrappedHandler(mockRequest, mockContext);
    
    expect(response.status).toBe(500);
    
    const data = await response.json();
    expect(data).toMatchObject({
      status: 500,
      title: "Internal Server Error",
      type: "https://example.com/probs/internal-server-error",
      detail: "An unexpected error occurred",
    });
  });
});

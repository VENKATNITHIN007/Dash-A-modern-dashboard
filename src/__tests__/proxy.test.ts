import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import dns from "node:dns";
import { GET, POST } from "@/app/api/proxy/[...path]/route";
import { getSession } from "@/lib/auth";
import { env } from "@/lib/env";

// Mock dependencies
vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/tenant", () => ({
  createTenantClient: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  env: {
    PROXY_ALLOWED_DOMAINS: "api.stripe.com, api.github.com",
    BACKEND_API_KEY: "secret-key-123",
  }
}));

vi.mock("node:dns", () => ({
  default: {
    promises: {
      lookup: vi.fn(),
    }
  }
}));

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("Proxy API Route SSRF Protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default valid session
    vi.mocked(getSession).mockResolvedValue({
      user: { id: "user-1", email: "test@example.com", name: "Test User", role: "admin", orgId: "org-1" },
      session: { id: "session-1", expiresAt: new Date() },
    });

    // Default valid DNS resolution (safe IP)
    vi.mocked(dns.promises.lookup).mockResolvedValue({ address: "8.8.8.8", family: 4 });
    
    // Default successful fetch response
    mockFetch.mockResolvedValue(new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: new Headers({ "Content-Type": "application/json" })
    }));
  });

  it("should block requests to domains not in the whitelist", async () => {
    const req = new NextRequest("http://localhost:3000/api/proxy/evil.com/data");
    const ctx = { params: Promise.resolve({ path: ["evil.com", "data"] }) };
    
    const response = await GET(req, ctx as any);
    expect(response.status).toBe(403);
    
    const data = await response.json();
    expect(data.error).toBe("Domain not allowed");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("should allow requests to whitelisted domains", async () => {
    const req = new NextRequest("http://localhost:3000/api/proxy/api.stripe.com/v1/charges");
    const ctx = { params: Promise.resolve({ path: ["api.stripe.com", "v1", "charges"] }) };
    
    const response = await GET(req, ctx as any);
    expect(response.status).toBe(200);
    expect(mockFetch).toHaveBeenCalled();
  });

  it("should block requests that resolve to localhost (127.0.0.1)", async () => {
    // DNS rebinding attack or just pointing a whitelisted domain to localhost
    vi.mocked(dns.promises.lookup).mockResolvedValue({ address: "127.0.0.1", family: 4 });
    
    const req = new NextRequest("http://localhost:3000/api/proxy/api.stripe.com/v1/charges");
    const ctx = { params: Promise.resolve({ path: ["api.stripe.com", "v1", "charges"] }) };
    
    const response = await GET(req, ctx as any);
    expect(response.status).toBe(403);
    
    const data = await response.json();
    expect(data.error).toBe("Access to internal IPs is blocked");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("should block requests that resolve to AWS metadata IP (169.254.169.254)", async () => {
    vi.mocked(dns.promises.lookup).mockResolvedValue({ address: "169.254.169.254", family: 4 });
    
    const req = new NextRequest("http://localhost:3000/api/proxy/api.stripe.com/data");
    const ctx = { params: Promise.resolve({ path: ["api.stripe.com", "data"] }) };
    
    const response = await GET(req, ctx as any);
    expect(response.status).toBe(403);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("should block requests that resolve to internal network (10.x.x.x)", async () => {
    vi.mocked(dns.promises.lookup).mockResolvedValue({ address: "10.0.0.1", family: 4 });
    
    const req = new NextRequest("http://localhost:3000/api/proxy/api.stripe.com/data");
    const ctx = { params: Promise.resolve({ path: ["api.stripe.com", "data"] }) };
    
    const response = await GET(req, ctx as any);
    expect(response.status).toBe(403);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("should block non-HTTPS external requests", async () => {
    const req = new NextRequest("http://localhost:3000/api/proxy/http/api.stripe.com/data");
    const ctx = { params: Promise.resolve({ path: ["http", "api.stripe.com", "data"] }) };
    
    const response = await GET(req, ctx as any);
    expect(response.status).toBe(403);
    
    const data = await response.json();
    expect(data.error).toBe("HTTPS required for external requests");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("should inject BACKEND_API_KEY when making the proxy request", async () => {
    const req = new NextRequest("http://localhost:3000/api/proxy/api.github.com/user");
    const ctx = { params: Promise.resolve({ path: ["api.github.com", "user"] }) };
    
    await GET(req, ctx as any);
    
    expect(mockFetch).toHaveBeenCalled();
    const fetchOptions = mockFetch.mock.calls[0][1];
    expect(fetchOptions.headers.get("Authorization")).toBe("Bearer secret-key-123");
  });

  it("should strip dangerous headers from the original request", async () => {
    const req = new NextRequest("http://localhost:3000/api/proxy/api.github.com/user", {
      headers: {
        "x-forwarded-host": "evil.com",
        "cookie": "session=123",
        "authorization": "Bearer user-token",
        "x-custom-header": "safe-value"
      }
    });
    const ctx = { params: Promise.resolve({ path: ["api.github.com", "user"] }) };
    
    await GET(req, ctx as any);
    
    expect(mockFetch).toHaveBeenCalled();
    const fetchOptions = mockFetch.mock.calls[0][1];
    expect(fetchOptions.headers.has("x-forwarded-host")).toBe(false);
    expect(fetchOptions.headers.has("cookie")).toBe(false);
    // Notice that "authorization" gets overridden by the backend API key, 
    // but the original one was stripped anyway
    expect(fetchOptions.headers.get("Authorization")).toBe("Bearer secret-key-123");
    expect(fetchOptions.headers.get("x-custom-header")).toBe("safe-value");
  });
});

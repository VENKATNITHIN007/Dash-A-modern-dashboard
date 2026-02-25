import "server-only";
import { NextResponse } from "next/server";
import dns from "node:dns";
import { withApiAuth } from "@/lib/api-handler";
import { env } from "@/lib/env";

function isInternalIp(ip: string): boolean {
  if (ip === "127.0.0.1" || ip === "::1" || ip === "localhost") return true;
  if (ip.startsWith("10.")) return true;
  if (ip.startsWith("192.168.")) return true;
  if (ip.startsWith("169.254.")) return true;
  if (ip.startsWith("172.")) {
    const secondOctet = parseInt(ip.split(".")[1], 10);
    if (secondOctet >= 16 && secondOctet <= 31) return true;
  }
  return false;
}

const handler = withApiAuth<{ path: string[] }>(async (req, ctx) => {
  const targetUrlStr = req.headers.get("x-proxy-target") || req.nextUrl.searchParams.get("target");
  let targetUrl: URL;

  if (targetUrlStr) {
    try {
      targetUrl = new URL(targetUrlStr);
      if (ctx.params?.path) {
        const pathSuffix = ctx.params.path.join("/");
        targetUrl.pathname = targetUrl.pathname.replace(/\/$/, "") + "/" + pathSuffix;
      }
    } catch {
      return NextResponse.json({ error: "Invalid target URL" }, { status: 400 });
    }
  } else {
    if (!ctx.params?.path || ctx.params.path.length === 0) {
      return NextResponse.json({ error: "Missing proxy target" }, { status: 400 });
    }
    
    let protocol = "https:";
    let domainIndex = 0;
    
    if (ctx.params.path[0] === "http" || ctx.params.path[0] === "https") {
      protocol = ctx.params.path[0] + ":";
      domainIndex = 1;
    }
    
    const domain = ctx.params.path[domainIndex];
    if (!domain) {
      return NextResponse.json({ error: "Missing proxy domain" }, { status: 400 });
    }
    
    const restPath = ctx.params.path.slice(domainIndex + 1).join("/");
    const search = req.nextUrl.search;
    
    try {
      targetUrl = new URL(`${protocol}//${domain}/${restPath}${search}`);
    } catch {
      return NextResponse.json({ error: "Invalid target URL construction" }, { status: 400 });
    }
  }

  // 1. Whitelist allowed domains
  const allowedDomains = env.PROXY_ALLOWED_DOMAINS?.split(",").map((d: string) => d.trim()) || [];
  if (allowedDomains.length > 0 && !allowedDomains.includes(targetUrl.hostname)) {
    return NextResponse.json({ error: "Domain not allowed" }, { status: 403 });
  }
  
  // 2. Validate URL protocol (https only for external)
  if (targetUrl.protocol !== "https:") {
    if (targetUrl.hostname !== "localhost" && targetUrl.hostname !== "127.0.0.1") {
      return NextResponse.json({ error: "HTTPS required for external requests" }, { status: 403 });
    }
  }

  // 3. Block requests to internal IPs
  try {
    const lookup = await dns.promises.lookup(targetUrl.hostname);
    if (isInternalIp(lookup.address)) {
      return NextResponse.json({ error: "Access to internal IPs is blocked" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Failed to resolve hostname" }, { status: 400 });
  }

  // 4. Strip dangerous headers and don't forward client cookies/auth
  const headers = new Headers();
  
  const unsafeHeaders = [
    "host", "connection", "cookie", "authorization", 
    "x-forwarded-for", "x-forwarded-host", "x-forwarded-proto",
    "x-real-ip", "referer", "origin"
  ];
  
  for (const [key, value] of req.headers.entries()) {
    if (!unsafeHeaders.includes(key.toLowerCase()) && !key.toLowerCase().startsWith("x-proxy-")) {
      headers.set(key, value);
    }
  }

  // 5. Forward requests with backend-only API keys injected
  if (env.BACKEND_API_KEY) {
    headers.set("Authorization", `Bearer ${env.BACKEND_API_KEY}`);
  }

  // 6. Make request
  try {
    const fetchOptions: RequestInit = {
      method: req.method,
      headers,
      redirect: "manual",
      cache: "no-store"
    };

    if (req.method !== "GET" && req.method !== "HEAD") {
      fetchOptions.body = await req.arrayBuffer();
    }

    const response = await fetch(targetUrl.toString(), fetchOptions);

    // 7. Return response without exposing internal details
    const resHeaders = new Headers();
    const exposeHeaders = ["content-type", "content-length", "cache-control", "etag"];
    for (const [key, value] of response.headers.entries()) {
      if (exposeHeaders.includes(key.toLowerCase())) {
        resHeaders.set(key, value);
      }
    }

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: resHeaders,
    });
  } catch (error) {
    console.error("[PROXY_ERROR]", error);
    return NextResponse.json({ error: "Proxy request failed" }, { status: 502 });
  }
});

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;

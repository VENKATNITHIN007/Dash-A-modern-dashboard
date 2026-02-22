import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { env } from "@/lib/env";

type Duration = `${number} s` | `${number} m` | `${number} h` | `${number} d`;

/**
 * Interface for rate limiter to ensure consistency between Redis and in-memory fallback
 */
export interface RateLimiter {
  limit: (identifier: string) => Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
  }>;
}

/**
 * Creates a rate limiter instance.
 * Gracefully falls back to in-memory rate limiting if Upstash Redis is not configured.
 * Default limits: 100 requests per 60 seconds.
 */
export function createRateLimiter(
  requests = 100,
  duration: Duration = "60 s"
): RateLimiter {
  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
    return new Ratelimit({
      redis: new Redis({
        url: env.UPSTASH_REDIS_REST_URL,
        token: env.UPSTASH_REDIS_REST_TOKEN,
      }),
      limiter: Ratelimit.slidingWindow(requests, duration),
      analytics: true,
      prefix: "@dashboard/ratelimit",
    });
  }

  // Fallback in-memory implementation for local development
  if (env.NODE_ENV !== "test") {
    console.warn(
      "Upstash Redis environment variables are missing. Falling back to in-memory rate limiting."
    );
  }

  const cache = new Map<string, { count: number; reset: number }>();

  return {
    limit: async (identifier: string) => {
      const now = Date.now();
      const bucket = cache.get(identifier);

      const match = duration.match(/^(\d+)\s*([smhd])$/);
      const value = match ? parseInt(match[1]) : 60;
      const unit = match ? match[2] : "s";

      const unitToMs: Record<string, number> = {
        s: 1000,
        m: 60000,
        h: 3600000,
        d: 86400000,
      };

      const durationMs = value * (unitToMs[unit] ?? 1000);

      if (!bucket || now > bucket.reset) {
        const reset = now + durationMs;
        cache.set(identifier, { count: 1, reset });
        return {
          success: true,
          limit: requests,
          remaining: requests - 1,
          reset,
        };
      }

      if (bucket.count < requests) {
        bucket.count += 1;
        return {
          success: true,
          limit: requests,
          remaining: requests - bucket.count,
          reset: bucket.reset,
        };
      }

      return {
        success: false,
        limit: requests,
        remaining: 0,
        reset: bucket.reset,
      };
    },
  };
}

/**
 * Default rate limiter for general use
 */
export const ratelimit = createRateLimiter();

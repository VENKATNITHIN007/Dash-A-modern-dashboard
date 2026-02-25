import { z } from "zod";

const serverSchema = z.object({
  DATABASE_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  PROXY_ALLOWED_DOMAINS: z.string().optional(),
  BACKEND_API_KEY: z.string().optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const serverEnvResult = serverSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  PROXY_ALLOWED_DOMAINS: process.env.PROXY_ALLOWED_DOMAINS,
  BACKEND_API_KEY: process.env.BACKEND_API_KEY,
  NODE_ENV: process.env.NODE_ENV,
});

const clientEnvResult = clientSchema.safeParse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NODE_ENV: process.env.NODE_ENV,
});

if (!serverEnvResult.success) {
  console.error("❌ Invalid server environment variables:", serverEnvResult.error.flatten().fieldErrors);
  throw new Error("Invalid server environment variables");
}

if (!clientEnvResult.success) {
  console.error("❌ Invalid client environment variables:", clientEnvResult.error.flatten().fieldErrors);
  throw new Error("Invalid client environment variables");
}

export const serverEnv = serverEnvResult.data;
export const clientEnv = clientEnvResult.data;

export const env = {
  ...serverEnv,
  ...clientEnv,
};

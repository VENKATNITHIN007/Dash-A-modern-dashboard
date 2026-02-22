import "server-only";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { z } from "zod";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import type { AuthSession } from "@/types/auth";
import { USER_ROLE_VALUES } from "@/types/auth";
import { sessionUserSchema } from "@/validations/auth";

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.NEXT_PUBLIC_APP_URL,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  user: {
    additionalFields: {
      orgId: { type: "string" },
      role: { type: [...USER_ROLE_VALUES] },
    },
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 7 * 24 * 60 * 60,
    },
  },
  advanced: {
    defaultCookieAttributes: {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
    },
  },
});

const authSessionSchema = z.object({
  user: sessionUserSchema,
  session: z.object({
    id: z.string(),
    expiresAt: z.coerce.date(),
  }),
});

export async function getSession(headers: Headers): Promise<AuthSession | null> {
  const result = await auth.api.getSession({ headers });
  if (!result) return null;

  const normalized = {
    ...result,
    user: {
      ...result.user,
      image: result.user.image ?? undefined,
    },
  };

  const parsed = authSessionSchema.safeParse(normalized);
  return parsed.success ? parsed.data : null;
}

"use client";

import { createAuthClient } from "better-auth/react";

import { clientEnv } from "@/lib/env";

export const authClient = createAuthClient({
  baseURL: clientEnv.NEXT_PUBLIC_APP_URL,
});

export const { useSession, signIn, signOut } = authClient;

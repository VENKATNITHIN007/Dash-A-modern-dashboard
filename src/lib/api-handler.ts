import "server-only";

import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { ApiError, ForbiddenError, UnauthorizedError, ValidationError } from "@/lib/errors";
import { createTenantClient } from "@/lib/tenant";
import type { AuthSession, SessionUser } from "@/types/auth";

export interface ApiHandlerContext<TParams = unknown> {
  user: SessionUser;
  session: AuthSession["session"];
  orgId: string;
  db: ReturnType<typeof createTenantClient>;
  params?: TParams;
}

export type ProtectedApiHandler<TParams = unknown> = (
  req: NextRequest,
  ctx: ApiHandlerContext<TParams>
) => Promise<Response> | Response;

// Next.js Route Handler type
export type NextRouteHandler<TParams = unknown> = (
  req: NextRequest,
  context: { params: Promise<TParams> | TParams }
) => Promise<Response>;

export function withApiAuth<TParams = unknown>(
  handler: ProtectedApiHandler<TParams>
): NextRouteHandler<TParams> {
  return async (req: NextRequest, routeContext) => {
    try {
      const sessionData = await getSession(req.headers);

      if (!sessionData || !sessionData.user) {
        throw new UnauthorizedError("Authentication required");
      }

      const { user, session } = sessionData;

      if (!user.orgId) {
        throw new ForbiddenError("User is not associated with an organization");
      }

      const db = createTenantClient(user.orgId);

      // Handle async or sync params from Next.js 15+
      let params: TParams | undefined = undefined;
      if (routeContext && "params" in routeContext) {
        params = (routeContext.params instanceof Promise
          ? await routeContext.params
          : routeContext.params) as TParams;
      }

      const ctx: ApiHandlerContext<TParams> = {
        user,
        session,
        orgId: user.orgId,
        db,
        params,
      };

      return await handler(req, ctx);
    } catch (error) {
      if (error instanceof ApiError) {
        const payload: Record<string, unknown> = {
          type: error.type,
          title: error.title,
          status: error.statusCode,
          detail: error.message,
        };

        if (error instanceof ValidationError && error.details?.length > 0) {
          payload.errors = error.details;
        }

        return NextResponse.json(payload, {
          status: error.statusCode,
          headers: {
            "Content-Type": "application/problem+json",
          },
        });
      }

      console.error("[API_ERROR]", error);

      return NextResponse.json(
        {
          type: "https://example.com/probs/internal-server-error",
          title: "Internal Server Error",
          status: 500,
          detail: "An unexpected error occurred",
        },
        {
          status: 500,
          headers: {
            "Content-Type": "application/problem+json",
          },
        }
      );
    }
  };
}

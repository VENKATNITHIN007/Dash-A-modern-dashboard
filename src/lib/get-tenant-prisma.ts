import type { AuthSession } from "@/types/auth";

import { createTenantClient } from "@/lib/tenant";

export function getTenantPrisma(session: AuthSession) {
  return createTenantClient(session.user.orgId);
}

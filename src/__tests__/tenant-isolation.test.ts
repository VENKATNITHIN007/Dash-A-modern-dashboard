import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { config as loadDotenv } from "dotenv";
import crypto from "node:crypto";

type TenantClient = {
  organization: {
    findMany: (args?: unknown) => Promise<Array<{ orgId: string; name: string }>>;
    findUnique: (args: unknown) => Promise<{ orgId: string; name: string } | null>;
  };
  lead: {
    findMany: (args?: unknown) => Promise<Array<{ id: string; orgId: string; name: string }>>;
    findUnique: (args: unknown) => Promise<{ id: string; orgId: string; name: string } | null>;
    update: (args: unknown) => Promise<unknown>;
    delete: (args: unknown) => Promise<unknown>;
    create: (args: unknown) => Promise<{ id: string; orgId: string; name: string }>;
  };
  $queryRaw: (...args: unknown[]) => Promise<unknown>;
  $executeRaw: (...args: unknown[]) => Promise<unknown>;
  $queryRawUnsafe?: (...args: unknown[]) => Promise<unknown>;
  $executeRawUnsafe?: (...args: unknown[]) => Promise<unknown>;
};

loadDotenv({ path: ".env.local" });

const envMutable = process.env as Record<string, string | undefined>;
envMutable.BETTER_AUTH_SECRET ??= "x".repeat(32);
envMutable.GOOGLE_CLIENT_ID ??= "test";
envMutable.GOOGLE_CLIENT_SECRET ??= "test";
envMutable.NEXT_PUBLIC_APP_URL ??= "http://localhost:3000";
envMutable.NODE_ENV ??= "test";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set for tenant isolation tests (set it in .env.local or the environment).",
  );
}

describe("tenant isolation", () => {
  const runId = crypto.randomUUID();
  const orgA = crypto.randomUUID();
  const orgB = crypto.randomUUID();

  let prisma: {
    $connect: () => Promise<void>;
    $disconnect: () => Promise<void>;
    organization: {
      create: (args: unknown) => Promise<unknown>;
      deleteMany: (args: unknown) => Promise<unknown>;
    };
    user: {
      deleteMany: (args: unknown) => Promise<unknown>;
    };
    lead: {
      create: (args: unknown) => Promise<{ id: string; orgId: string; name: string }>;
      findUnique: (args: unknown) => Promise<{ id: string; orgId: string; name: string } | null>;
      deleteMany: (args: unknown) => Promise<unknown>;
    };
    activity: { deleteMany: (args: unknown) => Promise<unknown> };
    note: { deleteMany: (args: unknown) => Promise<unknown> };
    leadTag: { deleteMany: (args: unknown) => Promise<unknown> };
    emailLog: { deleteMany: (args: unknown) => Promise<unknown> };
  };

  let createTenantClient: (orgId: string) => TenantClient;
  let getTenantPrisma: (session: { user: { orgId: string } }) => TenantClient;

  let leadA1: { id: string; orgId: string; name: string };
  let leadB1: { id: string; orgId: string; name: string };

  beforeAll(async () => {
    const prismaModule = await import("@/lib/prisma");
    prisma = prismaModule.prisma as unknown as typeof prisma;
    await prisma.$connect();

    await prisma.organization.create({
      data: {
        orgId: orgA,
        name: `Org A ${runId}`,
      },
    });

    await prisma.organization.create({
      data: {
        orgId: orgB,
        name: `Org B ${runId}`,
      },
    });

    leadA1 = await prisma.lead.create({
      data: {
        orgId: orgA,
        name: `Lead A1 ${runId}`,
        status: "new",
      },
    });

    leadB1 = await prisma.lead.create({
      data: {
        orgId: orgB,
        name: `Lead B1 ${runId}`,
        status: "new",
      },
    });

    const tenantModule = await import("@/lib/tenant");
    createTenantClient = tenantModule.createTenantClient as unknown as typeof createTenantClient;

    const getTenantModule = await import("@/lib/get-tenant-prisma");
    getTenantPrisma = getTenantModule.getTenantPrisma as unknown as typeof getTenantPrisma;
  });

  afterAll(async () => {
    await prisma.emailLog.deleteMany({ where: { orgId: { in: [orgA, orgB] } } });
    await prisma.leadTag.deleteMany({ where: { orgId: { in: [orgA, orgB] } } });
    await prisma.note.deleteMany({ where: { orgId: { in: [orgA, orgB] } } });
    await prisma.activity.deleteMany({ where: { orgId: { in: [orgA, orgB] } } });
    await prisma.lead.deleteMany({ where: { orgId: { in: [orgA, orgB] } } });
    await prisma.user.deleteMany({ where: { orgId: { in: [orgA, orgB] } } });
    await prisma.organization.deleteMany({ where: { orgId: { in: [orgA, orgB] } } });

    await prisma.$disconnect();
  });

  it("orgA queries never return orgB data", async () => {
    const tenantA = createTenantClient(orgA);
    const leads = await tenantA.lead.findMany();

    expect(leads.length).toBeGreaterThan(0);
    expect(leads.some((l) => l.id === leadB1.id)).toBe(false);
    expect(leads.every((l) => l.orgId === orgA)).toBe(true);
  });

  it("Organization is org-scoped", async () => {
    const tenantA = createTenantClient(orgA);

    const orgs = await tenantA.organization.findMany();
    expect(orgs.some((o) => o.orgId === orgB)).toBe(false);
    expect(orgs.every((o) => o.orgId === orgA)).toBe(true);

    const other = await tenantA.organization.findUnique({ where: { orgId: orgB } });
    expect(other).toBeNull();
  });

  it("findUnique enforces org boundary safely", async () => {
    const tenantA = createTenantClient(orgA);
    const maybeOther = await tenantA.lead.findUnique({ where: { id: leadB1.id } });
    expect(maybeOther).toBeNull();

    const own = await tenantA.lead.findUnique({ where: { id: leadA1.id } });
    expect(own?.orgId).toBe(orgA);
  });

  it("orgA update cannot modify orgB data", async () => {
    const tenantA = createTenantClient(orgA);
    await expect(
      tenantA.lead.update({ where: { id: leadB1.id }, data: { name: `HACKED ${runId}` } }),
    ).rejects.toThrow(/tenant|org|forbidden|not found/i);

    const reloaded = await prisma.lead.findUnique({ where: { id: leadB1.id } });
    expect(reloaded?.name).toBe(leadB1.name);
  });

  it("orgA delete cannot affect orgB data", async () => {
    const tenantA = createTenantClient(orgA);
    await expect(tenantA.lead.delete({ where: { id: leadB1.id } })).rejects.toThrow(
      /tenant|org|forbidden|not found/i,
    );

    const stillThere = await prisma.lead.findUnique({ where: { id: leadB1.id } });
    expect(stillThere).not.toBeNull();
  });

  it("create forces orgId (auto-injects / overrides)", async () => {
    const tenantA = createTenantClient(orgA);
    const created = await tenantA.lead.create({
      data: {
        orgId: orgB,
        name: `Lead A2 ${runId}`,
        status: "new",
      },
    });

    expect(created.orgId).toBe(orgA);
  });

  it("getTenantPrisma(session) returns an org-scoped client", async () => {
    const tenantFromSession = getTenantPrisma({ user: { orgId: orgA } });
    const leads = await tenantFromSession.lead.findMany();
    expect(leads.some((l) => l.id === leadB1.id)).toBe(false);
  });

  it("raw SQL methods throw on tenant client", async () => {
    const tenantA = createTenantClient(orgA);

    await expect(tenantA.$queryRaw`SELECT 1`).rejects.toThrow(/raw sql|queryraw|blocked/i);
    await expect(tenantA.$executeRaw`SELECT 1`).rejects.toThrow(/raw sql|executeraw|blocked/i);

    if (tenantA.$queryRawUnsafe) {
      await expect(tenantA.$queryRawUnsafe("SELECT 1")).rejects.toThrow(/raw sql|blocked/i);
    }
    if (tenantA.$executeRawUnsafe) {
      await expect(tenantA.$executeRawUnsafe("SELECT 1")).rejects.toThrow(/raw sql|blocked/i);
    }
  });
});

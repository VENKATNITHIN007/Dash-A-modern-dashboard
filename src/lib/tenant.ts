import { prisma } from "@/lib/prisma";

const RAW_SQL_METHODS: ReadonlySet<PropertyKey> = new Set([
  "$queryRaw",
  "$executeRaw",
  "$queryRawUnsafe",
  "$executeRawUnsafe",
]);

function blockRawSql<TClient extends object>(client: TClient): TClient {
  return new Proxy(client, {
    get(target, prop, receiver) {
      if (RAW_SQL_METHODS.has(prop)) {
        return async () => {
          throw new Error("Raw SQL is blocked on tenant-scoped Prisma clients");
        };
      }
      return Reflect.get(target, prop, receiver);
    },
  });
}

function withOrgWhere<TArgs extends { where?: unknown }>(args: TArgs, orgId: string): TArgs {
  const nextWhere = {
    ...(typeof args.where === "object" && args.where ? (args.where as Record<string, unknown>) : {}),
    orgId,
  };

  return { ...args, where: nextWhere };
}

function withOrgCreateData<TArgs extends { data: unknown }>(args: TArgs, orgId: string): TArgs {
  const data =
    typeof args.data === "object" && args.data ? (args.data as Record<string, unknown>) : {};

  if ("org" in data && typeof data.org === "object" && data.org) {
    return {
      ...args,
      data: {
        ...data,
        org: {
          connect: {
            orgId,
          },
        },
      },
    };
  }

  return { ...args, data: { ...data, orgId } };
}

function withOrgUpdateData<TArgs extends { data: unknown }>(args: TArgs, orgId: string): TArgs {
  const data =
    typeof args.data === "object" && args.data ? (args.data as Record<string, unknown>) : {};

  if (!("orgId" in data)) return args;
  return { ...args, data: { ...data, orgId } };
}

function ensureOrgResult<T>(result: T, orgId: string): T | null {
  if (!result || typeof result !== "object") return result;
  if (!("orgId" in result)) return result;
  const r = result as { orgId?: unknown };
  if (typeof r.orgId !== "string") return result;
  return r.orgId === orgId ? result : null;
}

type FindFirstLike = (args: unknown) => PromiseLike<unknown> | unknown;

async function assertOwned(
  findFirst: FindFirstLike,
  whereUnique: unknown,
  orgId: string,
  operation: "update" | "delete",
): Promise<void> {
  const where = {
    ...(typeof whereUnique === "object" && whereUnique ? (whereUnique as Record<string, unknown>) : {}),
    orgId,
  };

  const owned = await findFirst({ where, select: { id: true } });
  if (!owned) {
    throw new Error(`Tenant isolation blocked cross-org ${operation}`);
  }
}

export function createTenantClient(orgId: string) {
  const tenantClient = prisma.$extends({
    query: {
      organization: {
        findMany: ({ args, query }) => query(withOrgWhere(args, orgId)),
        findFirst: ({ args, query }) => query(withOrgWhere(args, orgId)),
        findUnique: async ({ args, query }) => ensureOrgResult(await query(args), orgId),
        create: ({ args, query }) => query(withOrgCreateData(args, orgId)),
        updateMany: ({ args, query }) =>
          query(withOrgWhere(withOrgUpdateData(args, orgId), orgId)),
        deleteMany: ({ args, query }) => query(withOrgWhere(args, orgId)),
        count: ({ args, query }) => query(withOrgWhere(args, orgId)),
        update: async ({ args, query }) => {
          await assertOwned(
            (prisma.organization.findFirst as unknown as FindFirstLike),
            args.where,
            orgId,
            "update",
          );
          return query(withOrgUpdateData(args, orgId));
        },
        delete: async ({ args, query }) => {
          await assertOwned(
            (prisma.organization.findFirst as unknown as FindFirstLike),
            args.where,
            orgId,
            "delete",
          );
          return query(args);
        },
      },
      user: {
        findMany: ({ args, query }) => query(withOrgWhere(args, orgId)),
        findFirst: ({ args, query }) => query(withOrgWhere(args, orgId)),
        findUnique: async ({ args, query }) => ensureOrgResult(await query(args), orgId),
        create: ({ args, query }) => query(withOrgCreateData(args, orgId)),
        updateMany: ({ args, query }) =>
          query(withOrgWhere(withOrgUpdateData(args, orgId), orgId)),
        deleteMany: ({ args, query }) => query(withOrgWhere(args, orgId)),
        count: ({ args, query }) => query(withOrgWhere(args, orgId)),
        update: async ({ args, query }) => {
          await assertOwned(
            (prisma.user.findFirst as unknown as FindFirstLike),
            args.where,
            orgId,
            "update",
          );
          return query(withOrgUpdateData(args, orgId));
        },
        delete: async ({ args, query }) => {
          await assertOwned(
            (prisma.user.findFirst as unknown as FindFirstLike),
            args.where,
            orgId,
            "delete",
          );
          return query(args);
        },
      },
      lead: {
        findMany: ({ args, query }) => query(withOrgWhere(args, orgId)),
        findFirst: ({ args, query }) => query(withOrgWhere(args, orgId)),
        findUnique: async ({ args, query }) => ensureOrgResult(await query(args), orgId),
        create: ({ args, query }) => query(withOrgCreateData(args, orgId)),
        updateMany: ({ args, query }) =>
          query(withOrgWhere(withOrgUpdateData(args, orgId), orgId)),
        deleteMany: ({ args, query }) => query(withOrgWhere(args, orgId)),
        count: ({ args, query }) => query(withOrgWhere(args, orgId)),
        update: async ({ args, query }) => {
          await assertOwned(
            (prisma.lead.findFirst as unknown as FindFirstLike),
            args.where,
            orgId,
            "update",
          );
          return query(withOrgUpdateData(args, orgId));
        },
        delete: async ({ args, query }) => {
          await assertOwned(
            (prisma.lead.findFirst as unknown as FindFirstLike),
            args.where,
            orgId,
            "delete",
          );
          return query(args);
        },
      },
      activity: {
        findMany: ({ args, query }) => query(withOrgWhere(args, orgId)),
        findFirst: ({ args, query }) => query(withOrgWhere(args, orgId)),
        findUnique: async ({ args, query }) => ensureOrgResult(await query(args), orgId),
        create: ({ args, query }) => query(withOrgCreateData(args, orgId)),
        updateMany: ({ args, query }) =>
          query(withOrgWhere(withOrgUpdateData(args, orgId), orgId)),
        deleteMany: ({ args, query }) => query(withOrgWhere(args, orgId)),
        count: ({ args, query }) => query(withOrgWhere(args, orgId)),
        update: async ({ args, query }) => {
          await assertOwned(
            (prisma.activity.findFirst as unknown as FindFirstLike),
            args.where,
            orgId,
            "update",
          );
          return query(withOrgUpdateData(args, orgId));
        },
        delete: async ({ args, query }) => {
          await assertOwned(
            (prisma.activity.findFirst as unknown as FindFirstLike),
            args.where,
            orgId,
            "delete",
          );
          return query(args);
        },
      },
      note: {
        findMany: ({ args, query }) => query(withOrgWhere(args, orgId)),
        findFirst: ({ args, query }) => query(withOrgWhere(args, orgId)),
        findUnique: async ({ args, query }) => ensureOrgResult(await query(args), orgId),
        create: ({ args, query }) => query(withOrgCreateData(args, orgId)),
        updateMany: ({ args, query }) =>
          query(withOrgWhere(withOrgUpdateData(args, orgId), orgId)),
        deleteMany: ({ args, query }) => query(withOrgWhere(args, orgId)),
        count: ({ args, query }) => query(withOrgWhere(args, orgId)),
        update: async ({ args, query }) => {
          await assertOwned(
            (prisma.note.findFirst as unknown as FindFirstLike),
            args.where,
            orgId,
            "update",
          );
          return query(withOrgUpdateData(args, orgId));
        },
        delete: async ({ args, query }) => {
          await assertOwned(
            (prisma.note.findFirst as unknown as FindFirstLike),
            args.where,
            orgId,
            "delete",
          );
          return query(args);
        },
      },
      leadTag: {
        findMany: ({ args, query }) => query(withOrgWhere(args, orgId)),
        findFirst: ({ args, query }) => query(withOrgWhere(args, orgId)),
        findUnique: async ({ args, query }) => ensureOrgResult(await query(args), orgId),
        create: ({ args, query }) => query(withOrgCreateData(args, orgId)),
        updateMany: ({ args, query }) =>
          query(withOrgWhere(withOrgUpdateData(args, orgId), orgId)),
        deleteMany: ({ args, query }) => query(withOrgWhere(args, orgId)),
        count: ({ args, query }) => query(withOrgWhere(args, orgId)),
        update: async ({ args, query }) => {
          await assertOwned(
            (prisma.leadTag.findFirst as unknown as FindFirstLike),
            args.where,
            orgId,
            "update",
          );
          return query(withOrgUpdateData(args, orgId));
        },
        delete: async ({ args, query }) => {
          await assertOwned(
            (prisma.leadTag.findFirst as unknown as FindFirstLike),
            args.where,
            orgId,
            "delete",
          );
          return query(args);
        },
      },
      emailLog: {
        findMany: ({ args, query }) => query(withOrgWhere(args, orgId)),
        findFirst: ({ args, query }) => query(withOrgWhere(args, orgId)),
        findUnique: async ({ args, query }) => ensureOrgResult(await query(args), orgId),
        create: ({ args, query }) => query(withOrgCreateData(args, orgId)),
        updateMany: ({ args, query }) =>
          query(withOrgWhere(withOrgUpdateData(args, orgId), orgId)),
        deleteMany: ({ args, query }) => query(withOrgWhere(args, orgId)),
        count: ({ args, query }) => query(withOrgWhere(args, orgId)),
        update: async ({ args, query }) => {
          await assertOwned(
            (prisma.emailLog.findFirst as unknown as FindFirstLike),
            args.where,
            orgId,
            "update",
          );
          return query(withOrgUpdateData(args, orgId));
        },
        delete: async ({ args, query }) => {
          await assertOwned(
            (prisma.emailLog.findFirst as unknown as FindFirstLike),
            args.where,
            orgId,
            "delete",
          );
          return query(args);
        },
      },
    },
  });

  return blockRawSql(tenantClient);
}

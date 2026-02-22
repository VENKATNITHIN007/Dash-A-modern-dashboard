import { PrismaPg } from "@prisma/adapter-pg";

import { env } from "@/lib/env";

// NEVER import from @/generated/prisma/client directly. Always use this module.
import { PrismaClient } from "@/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

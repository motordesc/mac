import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient;
  pool: Pool;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  // Create a pg Pool for the driver adapter
  const pool =
    globalForPrisma.pool ??
    new Pool({
      connectionString,
      max: 10,
      // CockroachDB requires SSL in production
      ...(process.env.NODE_ENV === "production" && connectionString?.includes("cockroachlabs")
        ? { ssl: { rejectUnauthorized: false } }
        : {}),
    });

  // Prisma 7 requires a driver adapter — the internal engine was removed
  // Cast pool to `any` to work around @types/pg version mismatch between
  // @prisma/adapter-pg (bundles @types/pg@8.11.x) and our @types/pg@8.18.x
  const adapter = new PrismaPg(pool as any);

  const client = new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

  // Cache the pool so HMR doesn't leak connections
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.pool = pool;
  }

  return client;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

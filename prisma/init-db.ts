/**
 * Initialize Database (Development Only)
 *
 * ⚠️ WARNING: This script uses `prisma db push` which is for DEVELOPMENT ONLY.
 * For production deployments, use `prisma migrate deploy` instead.
 *
 * The build script (`pnpm build`) uses `prisma migrate deploy` automatically.
 * This script is kept for local development convenience.
 */

import { execSync } from "child_process";

console.log("🔧 Pushing schema to database (development mode)...");

try {
  execSync("pnpm prisma db push", { stdio: "inherit" });
  console.log("✅ Database schema synchronized.");
} catch (error) {
  console.error("❌ Database push failed:", error);
  process.exit(1);
}

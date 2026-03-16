/**
 * Setup Database Script
 *
 * Run this script to initialize or migrate the database for a new environment.
 * It uses `prisma migrate deploy` (production-safe) instead of `db push --accept-data-loss`.
 *
 * Usage:
 *   pnpm db:setup
 *
 * What it does:
 *   1. Generates the Prisma client
 *   2. Applies all pending migrations (safe — never drops data)
 *   3. Optionally seeds the database with initial data
 *
 * For development schema changes, use `pnpm db:migrate` instead (creates new migration files).
 */

import { execSync } from "child_process";

function run(cmd: string, label: string) {
  console.log(`\n🔧 ${label}...`);
  try {
    execSync(cmd, { stdio: "inherit" });
    console.log(`✅ ${label} — done`);
  } catch (error) {
    console.error(`❌ ${label} — failed`);
    process.exit(1);
  }
}

async function main() {
  console.log("━━━ Motor Auto Care — Database Setup ━━━\n");

  // Step 1: Generate Prisma client
  run("pnpm prisma generate", "Generating Prisma client");

  // Step 2: Apply pending migrations (production-safe)
  run("pnpm prisma migrate deploy", "Applying database migrations");

  // Step 3: Seed database (optional — only if seed data doesn't exist)
  const shouldSeed = process.argv.includes("--seed");
  if (shouldSeed) {
    run("pnpm db:seed", "Seeding database with initial data");
  }

  console.log("\n━━━ Database setup complete ━━━");
  if (!shouldSeed) {
    console.log("💡 To seed the database, run: pnpm db:setup -- --seed");
  }
}

main();

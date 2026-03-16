import { execSync } from "child_process";

async function main() {
  console.log("🚀 Initializing database setup...");

  try {
    // 1. Push schema to database (best for Vercel/Serverless during init)
    // This ensures tables exist without needing manual migration management in some environments
    console.log("📤 Pushing database schema...");
    execSync("pnpm prisma db push --accept-data-loss", { stdio: "inherit" });

    console.log("✅ Database initialized successfully!");
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    process.exit(1);
  }
}

main();

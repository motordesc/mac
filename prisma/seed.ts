import { prisma } from "../lib/prisma";

async function main() {
  // ── Roles ──────────────────────────────────────────────────────────────
  await prisma.role.upsert({ where: { name: "Admin" }, create: { name: "Admin" }, update: {} });
  await prisma.role.upsert({ where: { name: "Manager" }, create: { name: "Manager" }, update: {} });
  await prisma.role.upsert({ where: { name: "Technician" }, create: { name: "Technician" }, update: {} });

  // ── Garage settings ────────────────────────────────────────────────────
  await prisma.garageSettings.upsert({ where: { key: "garage_name" }, create: { key: "garage_name", value: "Motor Auto Care" }, update: {} });
  await prisma.garageSettings.upsert({ where: { key: "tax_rate" }, create: { key: "tax_rate", value: "18" }, update: {} });

  // Branches are NOT seeded — users create them via the app UI.

  console.log("Seed completed: roles, garage settings.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // ── Roles ──────────────────────────────────────────────────────────────
  const adminRole = await prisma.role.upsert({ where: { name: "Admin" }, create: { name: "Admin" }, update: {} });
  await prisma.role.upsert({ where: { name: "Manager" }, create: { name: "Manager" }, update: {} });
  await prisma.role.upsert({ where: { name: "Technician" }, create: { name: "Technician" }, update: {} });

  // ── Garage settings ────────────────────────────────────────────────────
  await prisma.garageSettings.upsert({ where: { key: "garage_name" }, create: { key: "garage_name", value: "Motor Auto Care" }, update: {} });
  await prisma.garageSettings.upsert({ where: { key: "tax_rate" }, create: { key: "tax_rate", value: "18" }, update: {} });

  // ── Default branch ─────────────────────────────────────────────────────
  let branch = await prisma.branch.findFirst({ where: { name: "Main Branch" } });
  if (!branch) {
    branch = await prisma.branch.create({
      data: { name: "Main Branch", address: "123 Main St, Bengaluru", phone: "+91 98765 43210" },
    });
  }

  // ── Sample customer + vehicle ──────────────────────────────────────────
  let customer = await prisma.customer.findFirst({ where: { phone: "+919876543210" } });
  if (!customer) {
    customer = await prisma.customer.create({ data: { name: "Sample Customer", phone: "+919876543210", address: "456 Park Ave, Bengaluru" } });
  }

  let vehicle = await prisma.vehicle.findFirst({ where: { numberPlate: "KA01AB1234" } });
  if (!vehicle) {
    vehicle = await prisma.vehicle.create({ data: { customerId: customer.id, numberPlate: "KA01AB1234", make: "Maruti", model: "Swift", year: 2020 } });
  }

  // ── Supplier + inventory ───────────────────────────────────────────────
  let supplier = await prisma.supplier.findFirst({ where: { name: "Auto Parts Ltd" } });
  if (!supplier) {
    supplier = await prisma.supplier.create({ data: { name: "Auto Parts Ltd", contact: "+919876543211" } });
  }

  const existingInv = await prisma.inventoryItem.findFirst({ where: { branchId: branch.id, name: "Engine Oil 5W30" } });
  if (!existingInv) {
    await prisma.inventoryItem.create({ data: { branchId: branch.id, name: "Engine Oil 5W30", sku: "OIL-5W30", supplierId: supplier.id, purchasePrice: 400, sellingPrice: 600, quantity: 50, minQuantity: 10 } });
  }

  // ── Service ────────────────────────────────────────────────────────────
  let service = await prisma.service.findFirst({ where: { name: "Oil Change" } });
  if (!service) {
    service = await prisma.service.create({ data: { name: "Oil Change", description: "Engine oil replacement", defaultPrice: 1500 } });
  }

  // ── Staff (branch-linked) ──────────────────────────────────────────────
  let staff = await prisma.staff.findFirst({ where: { branchId: branch.id, name: "Raj Kumar" } });
  if (!staff) {
    staff = await prisma.staff.create({ data: { branchId: branch.id, name: "Raj Kumar", role: "MECHANIC", phone: "+919876543212" } });
  }

  console.log("Seed completed: roles, branch, garage settings, customer, vehicle, supplier, inventory, service, staff.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // ── Roles ──────────────────────────────────────────────────────────────
  await prisma.role.upsert({ where: { name: "Admin" }, create: { name: "Admin" }, update: {} });
  await prisma.role.upsert({ where: { name: "Manager" }, create: { name: "Manager" }, update: {} });
  await prisma.role.upsert({ where: { name: "Technician" }, create: { name: "Technician" }, update: {} });

  // ── Garage settings ────────────────────────────────────────────────────
  await prisma.garageSettings.upsert({ where: { key: "garage_name" }, create: { key: "garage_name", value: "Motor Auto Care" }, update: {} });
  await prisma.garageSettings.upsert({ where: { key: "tax_rate" }, create: { key: "tax_rate", value: "18" }, update: {} });

  // ── Default branch ─────────────────────────────────────────────────────
  const branch = await prisma.branch.upsert({
    where: { id: "default-branch-id" }, // Using a fixed ID for idempotency in seed
    update: {},
    create: {
      id: "default-branch-id",
      name: "Main Branch",
      address: "123 Main St, Bengaluru",
      phone: "+91 98765 43210"
    }
  });

  // ── Sample customer + vehicle ──────────────────────────────────────────
  const customer = await prisma.customer.upsert({
    where: { id: "sample-customer-id" },
    update: {},
    create: {
      id: "sample-customer-id",
      name: "Sample Customer",
      phone: "+919876543210",
      address: "456 Park Ave, Bengaluru"
    }
  });

  const vehicle = await prisma.vehicle.upsert({
    where: { id: "sample-vehicle-id" },
    update: {},
    create: {
      id: "sample-vehicle-id",
      customerId: customer.id,
      numberPlate: "KA01AB1234",
      make: "Maruti",
      model: "Swift",
      year: 2020
    }
  });

  // ── Supplier + inventory ───────────────────────────────────────────────
  const supplier = await prisma.supplier.upsert({
    where: { id: "sample-supplier-id" },
    update: {},
    create: {
      id: "sample-supplier-id",
      name: "Auto Parts Ltd",
      contact: "+919876543211"
    }
  });

  await prisma.inventoryItem.upsert({
    where: { id: "sample-inventory-id" },
    update: {},
    create: {
      id: "sample-inventory-id",
      branchId: branch.id,
      name: "Engine Oil 5W30",
      sku: "OIL-5W30",
      supplierId: supplier.id,
      purchasePrice: 400,
      sellingPrice: 600,
      quantity: 50,
      minQuantity: 10
    }
  });

  // ── Service ────────────────────────────────────────────────────────────
  await prisma.service.upsert({
    where: { id: "sample-service-id" },
    update: {},
    create: {
      id: "sample-service-id",
      name: "Oil Change",
      description: "Engine oil replacement",
      defaultPrice: 1500
    }
  });

  // ── Staff (branch-linked) ──────────────────────────────────────────────
  await prisma.staff.upsert({
    where: { id: "sample-staff-id" },
    update: {},
    create: {
      id: "sample-staff-id",
      branchId: branch.id,
      name: "Raj Kumar",
      role: "MECHANIC",
      phone: "+919876543212"
    }
  });

  console.log("Seed completed: roles, branch, garage settings, customer, vehicle, supplier, inventory, service, staff.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

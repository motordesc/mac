"use server";

import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/actions/auth-guard";
import { getAuthorizedBranchId } from "@/lib/branch";
import { z } from "zod";

const saleItemSchema = z.object({
  type: z.enum(["SERVICE", "PART"]),
  refId: z.string().uuid(),         // serviceId or inventoryItemId
  description: z.string().min(1),
  quantity: z.coerce.number().int().min(1),
  unitPrice: z.coerce.number().min(0),
});

const quickSaleSchema = z.object({
  // Customer — either existing id or new details
  customerId: z.string().uuid().optional(),
  customerName: z.string().min(1).optional(),
  customerPhone: z.string().min(1).optional(),
  customerAddress: z.string().optional(),
  // Vehicle — either existing id or new plate
  vehicleId: z.string().uuid().optional(),
  vehicleNumberPlate: z.string().min(1).optional(),
  vehicleMake: z.string().optional(),
  vehicleModel: z.string().optional(),
  vehicleYear: z.coerce.number().int().min(1900).max(2100).optional().nullable(),
  // Technician
  technicianId: z.string().uuid().optional().nullable(),
  // Notes
  notes: z.string().optional(),
  // Items
  items: z.array(saleItemSchema).min(1, "Add at least one service or part"),
  // Tax
  taxPercent: z.coerce.number().min(0).max(100).default(0),
  // Payment
  paymentMethod: z.enum(["CASH", "CARD", "UPI", "BANK_TRANSFER", "OTHER"]),
  paymentAmount: z.coerce.number().min(0),
});

export type QuickSaleInput = z.infer<typeof quickSaleSchema>;
export type SaleItem = z.infer<typeof saleItemSchema>;

function generateInvoiceNumber(): string {
  const now = new Date();
  const datePart = now.toISOString().slice(2, 10).replace(/-/g, "");
  const randomPart = crypto.randomUUID().slice(0, 8).toUpperCase();
  return `INV-${datePart}-${randomPart}`;
}

export async function processQuickSale(data: QuickSaleInput) {
  await requireRole(["Admin", "Manager", "Technician"]);

  const branchId = await getAuthorizedBranchId();
  if (!branchId) {
    throw new Error("Unauthorized or no branch selected. Please select a branch you have access to.");
  }

  // Validate input
  const parsed = quickSaleSchema.safeParse(data);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new Error(first?.message ?? "Validation failed");
  }
  const d = parsed.data;

  // Stock check
  const partItems = d.items.filter(i => i.type === "PART");
  if (partItems.length > 0) {
    const inventoryIds = partItems.map(i => i.refId);
    const stockLevels = await prisma.inventoryItem.findMany({
      where: { id: { in: inventoryIds } },
      select: { id: true, quantity: true, name: true }
    });

    for (const item of partItems) {
      const stock = stockLevels.find((s: { id: string; quantity: number; name: string }) => s.id === item.refId);
      if (!stock || stock.quantity < item.quantity) {
        throw new Error(`Insufficient stock for ${stock?.name || "item"}. Available: ${stock?.quantity || 0}, Required: ${item.quantity}`);
      }
    }
  }

  // Need either customerId or (customerName + customerPhone)
  if (!d.customerId && (!d.customerName || !d.customerPhone)) {
    throw new Error("Provide an existing customer or enter a name and phone number.");
  }
  // Need either vehicleId or vehicleNumberPlate
  if (!d.vehicleId && !d.vehicleNumberPlate) {
    throw new Error("Provide an existing vehicle or enter a number plate.");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await prisma.$transaction(async (tx: any) => {
    // ── 1. Customer ────────────────────────────────────────────────────
    let customerId = d.customerId;
    if (!customerId) {
      const existing = await tx.customer.findFirst({
        where: { phone: d.customerPhone! },
        select: { id: true },
      });
      if (existing) {
        customerId = existing.id;
      } else {
        const created = await tx.customer.create({
          data: {
            name: d.customerName!,
            phone: d.customerPhone!,
            address: d.customerAddress || undefined,
          },
        });
        customerId = created.id;
      }
    }

    // ── 2. Vehicle ─────────────────────────────────────────────────────
    let vehicleId = d.vehicleId;
    if (!vehicleId) {
      const normalizedPlate = d.vehicleNumberPlate!.replace(/\s/g, "").toUpperCase();
      const existing = await tx.vehicle.findFirst({
        where: { numberPlate: { equals: normalizedPlate, mode: "insensitive" } },
        select: { id: true },
      });
      if (existing) {
        vehicleId = existing.id;
      } else {
        const created = await tx.vehicle.create({
          data: {
            customerId,
            numberPlate: normalizedPlate,
            make: d.vehicleMake || undefined,
            model: d.vehicleModel || undefined,
            year: d.vehicleYear || undefined,
          },
        });
        vehicleId = created.id;
      }
    }

    // ── 3. Job Card ────────────────────────────────────────────────────
    const jobCard = await tx.jobCard.create({
      data: {
        branchId,
        vehicleId,
        customerId,
        technicianId: d.technicianId || undefined,
        status: "CLOSED",
        notes: d.notes || undefined,
      },
    });

    // ── 4. Attach services/parts ───────────────────────────────────────
    for (const item of d.items) {
      if (item.type === "SERVICE") {
        await tx.jobCardService.upsert({
          where: { jobCardId_serviceId: { jobCardId: jobCard.id, serviceId: item.refId } },
          create: { jobCardId: jobCard.id, serviceId: item.refId, quantity: item.quantity, unitPrice: item.unitPrice, completed: true },
          update: { quantity: item.quantity, unitPrice: item.unitPrice },
        });
      } else {
        await tx.jobCardPart.create({
          data: { jobCardId: jobCard.id, inventoryItemId: item.refId, quantity: item.quantity, unitPrice: item.unitPrice },
        });
        await tx.inventoryItem.update({
          where: { id: item.refId },
          data: { quantity: { decrement: item.quantity } },
        });
        await tx.inventoryTransaction.create({
          data: { inventoryItemId: item.refId, quantity: -item.quantity, type: "SALE", jobCardId: jobCard.id },
        });
      }
    }

    // ── 5. Invoice ─────────────────────────────────────────────────────
    const subtotal = d.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const taxAmount = parseFloat(((subtotal * d.taxPercent) / 100).toFixed(2));
    const total = subtotal + taxAmount;

    let invoiceNumber = "";
    for (let attempt = 0; attempt < 3; attempt++) {
      const candidate = generateInvoiceNumber();
      const existing = await tx.invoice.findUnique({ where: { invoiceNumber: candidate }, select: { id: true } });
      if (!existing) {
        invoiceNumber = candidate;
        break;
      }
    }
    if (!invoiceNumber) {
      throw new Error("Failed to generate unique invoice number. Please try again.");
    }

    const invoice = await tx.invoice.create({
      data: {
        branchId,
        customerId,
        jobCardId: jobCard.id,
        invoiceNumber,
        subtotal,
        tax: taxAmount,
        total,
        status: d.paymentAmount >= total ? "PAID" : "PENDING",
        items: {
          create: d.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            type: item.type,
          })),
        },
      },
    });

    // ── 6. Payment ─────────────────────────────────────────────────────
    if (d.paymentAmount > 0) {
      await tx.payment.create({
        data: {
          branchId,
          invoiceId: invoice.id,
          jobCardId: jobCard.id,
          amount: d.paymentAmount,
          method: d.paymentMethod,
        },
      });
    }

    return { jobCard, invoice, customerId, vehicleId };
  });

  revalidatePath("/jobcards");
  revalidatePath("/invoices");
  revalidatePath("/dashboard");
  revalidatePath("/cashbook");

  return result;
}

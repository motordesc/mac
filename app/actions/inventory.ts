"use server";

import { prisma } from "@/lib/prisma";
import { createInventoryItemSchema, updateInventoryItemSchema } from "@/lib/validations/inventory";
import { revalidatePath } from "next/cache";

export async function getInventoryItems(params: {
  lowStock?: boolean;
  page?: number;
  limit?: number;
}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const skip = (page - 1) * limit;
  const [allItems, countAll] = await Promise.all([
    prisma.inventoryItem.findMany({
      skip,
      take: limit,
      orderBy: { name: "asc" },
      include: { supplier: { select: { name: true } } },
    }),
    prisma.inventoryItem.count(),
  ]);
  const items = params.lowStock
    ? allItems.filter((i) => i.quantity <= i.minQuantity)
    : allItems;
  const total = params.lowStock
    ? (await prisma.inventoryItem.findMany({ select: { id: true, quantity: true, minQuantity: true } })).filter(
        (i) => i.quantity <= i.minQuantity
      ).length
    : countAll;

  return {
    items: params.lowStock ? items.slice(0, limit) : allItems,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getLowStockCount() {
  const items = await prisma.inventoryItem.findMany({
    select: { id: true, quantity: true, minQuantity: true },
  });
  return items.filter((i) => i.quantity <= i.minQuantity).length;
}

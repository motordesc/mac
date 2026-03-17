"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { createInventoryItemSchema, updateInventoryItemSchema } from "@/lib/validations/inventory";
import { revalidatePath, updateTag, unstable_cache } from "next/cache";
import { cache } from "react";
import { requireRole, requireAuthenticatedUser } from "@/lib/actions/auth-guard";
import { validateId } from "@/lib/utils/validate-id";
import { getSelectedBranchId } from "@/lib/branch";

// Inner logic that can be safely aggressively cached across requests
const getInventoryItemsDb = unstable_cache(
  async (params: {
    lowStock?: boolean;
    page: number;
    limit: number;
    branchId?: string | null;
  }) => {
    const skip = (params.page - 1) * params.limit;

    if (params.lowStock) {
      const branchFilter = params.branchId
        ? Prisma.sql`AND i."branchId" = ${params.branchId}`
        : Prisma.empty;

      const [items, countResult] = await Promise.all([
        prisma.$queryRaw<
          Array<{
            id: string;
            name: string;
            sku: string | null;
            quantity: number;
            minQuantity: number;
            purchasePrice: number;
            sellingPrice: number;
            supplierId: string | null;
            branchId: string;
            supplier_name: string | null;
          }>
        >`
          SELECT
            i.id, i.name, i.sku, i.quantity, i."minQuantity",
            i."purchasePrice"::float AS "purchasePrice", i."sellingPrice"::float AS "sellingPrice",
            i."supplierId", i."branchId",
            s.name AS supplier_name
          FROM "InventoryItem" i
          LEFT JOIN "Supplier" s ON i."supplierId" = s.id
          WHERE i.quantity <= i."minQuantity"
          ${branchFilter}
          ORDER BY i.name ASC
          LIMIT ${params.limit} OFFSET ${skip}
        `,
        prisma.$queryRaw<[{ count: bigint }]>`
          SELECT COUNT(*)::bigint AS count
          FROM "InventoryItem" i
          WHERE i.quantity <= i."minQuantity"
          ${branchFilter}
        `,
      ]);
      const total = Number(countResult[0].count);
      const shaped = items.map((i) => ({
        ...i,
        supplier: i.supplier_name ? { name: i.supplier_name } : null,
      }));
      return { items: shaped, total, page: params.page, totalPages: Math.ceil(total / params.limit) };
    }

    const where = params.branchId ? { branchId: params.branchId } : {};
    const [items, total] = await Promise.all([
      prisma.inventoryItem.findMany({
        where,
        skip,
        take: params.limit,
        orderBy: { name: "asc" },
        include: { supplier: { select: { name: true } } },
      }),
      prisma.inventoryItem.count({ where }),
    ]);
    return { items, total, page: params.page, totalPages: Math.ceil(total / params.limit) };
  },
  ["inventory-items"],
  { tags: ["inventory"], revalidate: 3600 }
);

// Wrapper with request de-duplication and auth checks
export const getInventoryItems = cache(async (params: {
  lowStock?: boolean;
  page?: number;
  limit?: number;
  branchId?: string | null;
}) => {
  await requireAuthenticatedUser();
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;

  return getInventoryItemsDb({
    lowStock: params.lowStock,
    page,
    limit,
    branchId: params.branchId,
  });
});

const getLowStockCountDb = unstable_cache(
  async (branchId?: string | null) => {
    const branchFilter = branchId
      ? Prisma.sql`AND "branchId" = ${branchId}`
      : Prisma.empty;

    const result = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*)::bigint AS count
      FROM "InventoryItem"
      WHERE quantity <= "minQuantity"
      ${branchFilter}
    `;
    return Number(result[0].count);
  },
  ["inventory-low-stock"],
  { tags: ["inventory"], revalidate: 3600 }
);

export const getLowStockCount = cache(async (branchId?: string | null) => {
  await requireAuthenticatedUser();
  return getLowStockCountDb(branchId);
});

export async function createInventoryItem(formData: FormData) {
  await requireRole(["Admin", "Manager"]);

  const branchId = formData.get("branchId") as string || await getSelectedBranchId();
  if (!branchId) throw new Error("No branch selected. Please select a branch first.");
  validateId(branchId);

  const raw = Object.fromEntries(formData.entries());
  const parsed = createInventoryItemSchema.safeParse({
    name: raw.name,
    sku: raw.sku || undefined,
    supplierId: raw.supplierId || null,
    purchasePrice: raw.purchasePrice,
    sellingPrice: raw.sellingPrice,
    quantity: raw.quantity,
    minQuantity: raw.minQuantity,
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Validation failed");
  }
  const created = await prisma.inventoryItem.create({ data: { ...parsed.data, branchId } });
  updateTag("inventory");
  updateTag("dashboard");
  revalidatePath("/inventory");
  return created;
}

export async function updateInventoryItem(id: string, formData: FormData) {
  await requireRole(["Admin", "Manager"]);
  const safeId = validateId(id);

  const raw = Object.fromEntries(formData.entries());
  const parsed = updateInventoryItemSchema.safeParse({
    name: raw.name,
    sku: raw.sku || undefined,
    supplierId: raw.supplierId || null,
    purchasePrice: raw.purchasePrice,
    sellingPrice: raw.sellingPrice,
    quantity: raw.quantity,
    minQuantity: raw.minQuantity,
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Validation failed");
  }
  const updated = await prisma.inventoryItem.update({ where: { id: safeId }, data: parsed.data });
  updateTag("inventory");
  updateTag("dashboard");
  revalidatePath("/inventory");
  return updated;
}

export async function deleteInventoryItem(id: string) {
  await requireRole(["Admin"]);
  const safeId = validateId(id);
  await prisma.inventoryItem.delete({ where: { id: safeId } });
  updateTag("inventory");
  updateTag("dashboard");
  revalidatePath("/inventory");
}

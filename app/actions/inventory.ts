"use server";

import { prisma } from "@/lib/prisma";
import { createInventoryItemSchema, updateInventoryItemSchema } from "@/lib/validations/inventory";
import { revalidatePath } from "next/cache";
import { requireRole, requireAuthenticatedUser } from "@/lib/actions/auth-guard";
import { validateId } from "@/lib/utils/validate-id";
import { getSelectedBranchId } from "@/lib/branch";

export async function getInventoryItems(params: {
  lowStock?: boolean;
  page?: number;
  limit?: number;
  branchId?: string | null;
}) {
  await requireAuthenticatedUser();

  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const skip = (page - 1) * limit;

  if (params.lowStock) {
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
        ${params.branchId ? prisma.$queryRaw`AND i."branchId" = ${params.branchId}` : prisma.$queryRaw``}
        ORDER BY i.name ASC
        LIMIT ${limit} OFFSET ${skip}
      `,
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*)::bigint AS count
        FROM "InventoryItem" i
        WHERE i.quantity <= i."minQuantity"
        ${params.branchId ? prisma.$queryRaw`AND i."branchId" = ${params.branchId}` : prisma.$queryRaw``}
      `,
    ]);
    const total = Number(countResult[0].count);
    const shaped = items.map((i) => ({
      ...i,
      supplier: i.supplier_name ? { name: i.supplier_name } : null,
    }));
    return { items: shaped, total, page, totalPages: Math.ceil(total / limit) };
  }

  const where = params.branchId ? { branchId: params.branchId } : {};
  const [items, total] = await Promise.all([
    prisma.inventoryItem.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: "asc" },
      include: { supplier: { select: { name: true } } },
    }),
    prisma.inventoryItem.count({ where }),
  ]);
  return { items, total, page, totalPages: Math.ceil(total / limit) };
}

export async function getLowStockCount(branchId?: string | null) {
  await requireAuthenticatedUser();
  const where = branchId ? { branchId } : {};
  // Prisma raw for column-to-column comparison
  const result = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*)::bigint AS count
    FROM "InventoryItem"
    WHERE quantity <= "minQuantity"
    ${branchId ? prisma.$queryRaw`AND "branchId" = ${branchId}` : prisma.$queryRaw``}
  `;
  return Number(result[0].count);
}

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
  revalidatePath("/inventory");
  return updated;
}

export async function deleteInventoryItem(id: string) {
  await requireRole(["Admin"]);
  const safeId = validateId(id);
  await prisma.inventoryItem.delete({ where: { id: safeId } });
  revalidatePath("/inventory");
}

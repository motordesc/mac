"use server";

import { prisma } from "@/lib/prisma";
import { createExpenseSchema, updateExpenseSchema } from "@/lib/validations/expense";
import { revalidatePath } from "next/cache";
import { requireRole, requireAuthenticatedUser } from "@/lib/actions/auth-guard";
import { validateId } from "@/lib/utils/validate-id";
import { getSelectedBranchId } from "@/lib/branch";

export async function getExpenses(params?: {
  page?: number;
  limit?: number;
  branchId?: string | null;
}) {
  await requireAuthenticatedUser();

  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;
  const skip = (page - 1) * limit;
  const where = params?.branchId ? { branchId: params.branchId } : {};

  const [items, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      skip,
      take: limit,
      orderBy: { date: "desc" },
    }),
    prisma.expense.count({ where }),
  ]);
  return { items, total, page, totalPages: Math.ceil(total / limit) };
}

export async function createExpense(formData: FormData) {
  await requireRole(["Admin", "Manager"]);

  const branchId = formData.get("branchId") as string || await getSelectedBranchId();
  if (!branchId) throw new Error("No branch selected. Please select a branch first.");
  validateId(branchId);

  const raw = Object.fromEntries(formData.entries());
  const parsed = createExpenseSchema.safeParse({
    category: raw.category,
    amount: raw.amount,
    date: raw.date,
    description: raw.description || undefined,
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Validation failed");
  }
  const created = await prisma.expense.create({ data: { ...parsed.data, branchId } });
  revalidatePath("/expenses");
  revalidatePath("/cashbook");
  revalidatePath("/reports");
  return created;
}

export async function deleteExpense(id: string) {
  await requireRole(["Admin"]);
  const safeId = validateId(id);
  await prisma.expense.delete({ where: { id: safeId } });
  revalidatePath("/expenses");
  revalidatePath("/cashbook");
  revalidatePath("/reports");
}

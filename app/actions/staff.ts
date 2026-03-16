"use server";

import { prisma } from "@/lib/prisma";
import { createStaffSchema, updateStaffSchema } from "@/lib/validations/staff";
import { revalidatePath } from "next/cache";
import { requireRole, requireAuthenticatedUser } from "@/lib/actions/auth-guard";
import { validateId } from "@/lib/utils/validate-id";
import { getSelectedBranchId } from "@/lib/branch";

export async function getStaff(branchId?: string | null) {
  await requireAuthenticatedUser();
  const where = branchId ? { branchId } : {};
  return prisma.staff.findMany({
    where,
    orderBy: { name: "asc" },
    include: {
      _count: { select: { jobCards: true } },
      branch: { select: { name: true } },
    },
  });
}

export async function createStaff(formData: FormData) {
  await requireRole(["Admin"]);

  const branchId = formData.get("branchId") as string || await getSelectedBranchId();
  if (!branchId) throw new Error("No branch selected. Please select a branch first.");
  validateId(branchId);

  const raw = Object.fromEntries(formData.entries());
  const parsed = createStaffSchema.safeParse({
    name: raw.name,
    role: raw.role,
    phone: raw.phone || undefined,
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Validation failed");
  }
  const created = await prisma.staff.create({ data: { ...parsed.data, branchId } });
  revalidatePath("/staff");
  return created;
}

export async function updateStaff(id: string, formData: FormData) {
  await requireRole(["Admin"]);
  const safeId = validateId(id);

  const raw = Object.fromEntries(formData.entries());
  const parsed = updateStaffSchema.safeParse({
    name: raw.name,
    role: raw.role,
    phone: raw.phone || undefined,
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Validation failed");
  }
  const updated = await prisma.staff.update({ where: { id: safeId }, data: parsed.data });
  revalidatePath("/staff");
  return updated;
}

export async function deleteStaff(id: string) {
  await requireRole(["Admin"]);
  const safeId = validateId(id);
  await prisma.staff.delete({ where: { id: safeId } });
  revalidatePath("/staff");
}


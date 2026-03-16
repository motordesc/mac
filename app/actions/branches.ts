"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { requireRole, requireAuthenticatedUser } from "@/lib/actions/auth-guard";
import { validateId } from "@/lib/utils/validate-id";
import { BRANCH_COOKIE } from "@/lib/branch";
import { z } from "zod";

const branchSchema = z.object({
  name: z.string().min(1, "Branch name is required").max(100),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
});

// ── Read ──────────────────────────────────────────────────────────────────

export async function getBranches() {
  await requireAuthenticatedUser();
  return prisma.branch.findMany({
    orderBy: { name: "asc" },
    where: { isActive: true },
    include: {
      _count: { select: { jobCards: true, staff: true, userBranches: true } },
    },
  });
}

export async function getBranchById(id: string) {
  await requireAuthenticatedUser();
  const safeId = validateId(id);
  return prisma.branch.findUnique({
    where: { id: safeId },
    include: {
      userBranches: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
      staff: { select: { id: true, name: true, role: true } },
      _count: { select: { jobCards: true, invoices: true, expenses: true } },
    },
  });
}

// ── Write ─────────────────────────────────────────────────────────────────

export async function createBranch(formData: FormData) {
  await requireRole(["Admin"]);

  const raw = Object.fromEntries(formData.entries());
  const parsed = branchSchema.safeParse({
    name: raw.name,
    address: raw.address || undefined,
    phone: raw.phone || undefined,
    email: raw.email || undefined,
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Validation failed");
  }

  const branch = await prisma.branch.create({
    data: {
      name: parsed.data.name,
      address: parsed.data.address,
      phone: parsed.data.phone,
      email: parsed.data.email || undefined,
    },
  });
  revalidatePath("/branches");
  return branch;
}

export async function updateBranch(id: string, formData: FormData) {
  await requireRole(["Admin"]);
  const safeId = validateId(id);

  const raw = Object.fromEntries(formData.entries());
  const parsed = branchSchema.safeParse({
    name: raw.name,
    address: raw.address || undefined,
    phone: raw.phone || undefined,
    email: raw.email || undefined,
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Validation failed");
  }

  const branch = await prisma.branch.update({
    where: { id: safeId },
    data: {
      name: parsed.data.name,
      address: parsed.data.address,
      phone: parsed.data.phone,
      email: parsed.data.email || undefined,
    },
  });
  revalidatePath("/branches");
  revalidatePath(`/branches/${safeId}`);
  return branch;
}

export async function deleteBranch(id: string) {
  await requireRole(["Admin"]);
  const safeId = validateId(id);
  await prisma.branch.update({
    where: { id: safeId },
    data: { isActive: false },
  });
  revalidatePath("/branches");
}

// ── User Assignment ────────────────────────────────────────────────────────

export async function assignUserToBranch(userId: string, branchId: string) {
  await requireRole(["Admin"]);
  const safeUserId = validateId(userId);
  const safeBranchId = validateId(branchId);

  await prisma.userBranch.upsert({
    where: { userId_branchId: { userId: safeUserId, branchId: safeBranchId } },
    create: { userId: safeUserId, branchId: safeBranchId },
    update: {},
  });
  revalidatePath(`/branches/${safeBranchId}`);
  revalidatePath("/branches");
}

export async function removeUserFromBranch(userId: string, branchId: string) {
  await requireRole(["Admin"]);
  const safeUserId = validateId(userId);
  const safeBranchId = validateId(branchId);

  await prisma.userBranch.delete({
    where: { userId_branchId: { userId: safeUserId, branchId: safeBranchId } },
  });
  revalidatePath(`/branches/${safeBranchId}`);
}

// ── Branch Selection Cookie ────────────────────────────────────────────────

/**
 * Sets or clears the selected branch cookie.
 * Called by the BranchSelector client component.
 */
export async function setSelectedBranch(branchId: string | null) {
  await requireAuthenticatedUser();
  const cookieStore = await cookies();

  if (branchId) {
    // Validate that the branch actually exists
    const branch = await prisma.branch.findUnique({
      where: { id: branchId, isActive: true },
      select: { id: true },
    });
    if (!branch) throw new Error("Branch not found");

    cookieStore.set(BRANCH_COOKIE, branchId, {
      path: "/",
      httpOnly: false, // must be readable by client for selector UI state
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  } else {
    cookieStore.delete(BRANCH_COOKIE);
  }

  revalidatePath("/", "layout");
}

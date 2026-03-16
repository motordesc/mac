"use server";

import { prisma } from "@/lib/prisma";
import { createJobCardSchema, updateJobCardSchema } from "@/lib/validations/jobcard";
import { revalidatePath } from "next/cache";
import { requireRole, requireAuthenticatedUser } from "@/lib/actions/auth-guard";
import { validateId } from "@/lib/utils/validate-id";
import { getSelectedBranchId } from "@/lib/branch";

export async function getJobCards(params: {
  status?: string;
  page?: number;
  limit?: number;
  branchId?: string | null;
}) {
  await requireAuthenticatedUser();

  const page  = params.page ?? 1;
  const limit = params.limit ?? 20;
  const skip  = (page - 1) * limit;

  const branchWhere = params.branchId ? { branchId: params.branchId } : {};
  const statusWhere = params.status
    ? { status: params.status as "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CLOSED" }
    : {};
  const where = { ...branchWhere, ...statusWhere };

  const [items, total] = await Promise.all([
    prisma.jobCard.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        vehicle:    { select: { numberPlate: true, make: true, model: true } },
        customer:   { select: { name: true, phone: true } },
        technician: { select: { name: true } },
        branch:     { select: { name: true } },
        // Include invoice to show payment status
        invoice: { select: { id: true, status: true, total: true } },
        // Count payments
        payments: { select: { amount: true } },
      },
    }),
    prisma.jobCard.count({ where }),
  ]);
  return { items, total, page, totalPages: Math.ceil(total / limit) };
}

export async function getJobCardById(id: string) {
  await requireAuthenticatedUser();
  const safeId = validateId(id);

  return prisma.jobCard.findUnique({
    where: { id: safeId },
    include: {
      vehicle:    true,
      customer:   true,
      technician: true,
      branch:     true,
      services: { include: { service: true } },
      parts:    { include: { inventoryItem: true } },
      invoice:  true,
      payments: true,
      images:   true,
    },
  });
}

export async function createJobCard(formData: FormData) {
  await requireRole(["Admin", "Manager", "Technician"]);

  const branchId =
    (formData.get("branchId") as string) || (await getSelectedBranchId());
  if (!branchId)
    throw new Error("No branch selected. Please select a branch first.");
  validateId(branchId);

  const raw = Object.fromEntries(formData.entries());
  const parsed = createJobCardSchema.safeParse({
    vehicleId:     raw.vehicleId,
    customerId:    raw.customerId,
    technicianId:  raw.technicianId || null,
    status:        raw.status || "OPEN",
    estimatedCost: raw.estimatedCost ? Number(raw.estimatedCost) : null,
    notes:         raw.notes || null,
    serviceDueDate: raw.serviceDueDate || null,
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Validation failed");
  }
  const created = await prisma.jobCard.create({
    data: { ...parsed.data, branchId },
  });
  revalidatePath("/jobcards");
  revalidatePath("/dashboard");
  return created;
}

export async function updateJobCard(id: string, formData: FormData) {
  await requireRole(["Admin", "Manager", "Technician"]);
  const safeId = validateId(id);

  const raw = Object.fromEntries(formData.entries());
  const parsed = updateJobCardSchema.safeParse({
    vehicleId:     raw.vehicleId,
    customerId:    raw.customerId,
    technicianId:  raw.technicianId || null,
    status:        raw.status,
    estimatedCost: raw.estimatedCost ? Number(raw.estimatedCost) : null,
    notes:         raw.notes || null,
    serviceDueDate: raw.serviceDueDate || null,
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Validation failed");
  }
  const updated = await prisma.jobCard.update({
    where: { id: safeId },
    data: parsed.data as Parameters<typeof prisma.jobCard.update>[0]["data"],
  });
  revalidatePath("/jobcards");
  revalidatePath(`/jobcards/${safeId}`);
  revalidatePath("/dashboard");
  return updated;
}

export async function deleteJobCard(id: string) {
  await requireRole(["Admin"]);
  const safeId = validateId(id);
  await prisma.jobCard.delete({ where: { id: safeId } });
  revalidatePath("/jobcards");
  revalidatePath("/dashboard");
}

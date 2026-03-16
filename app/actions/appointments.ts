"use server";

import { prisma } from "@/lib/prisma";
import { createAppointmentSchema } from "@/lib/validations/appointment";
import { revalidatePath } from "next/cache";
import { requireRole, requireAuthenticatedUser } from "@/lib/actions/auth-guard";
import { validateId } from "@/lib/utils/validate-id";
import { getSelectedBranchId } from "@/lib/branch";

export async function getAppointments(params?: {
  upcoming?: boolean;
  page?: number;
  limit?: number;
  branchId?: string | null;
}) {
  await requireAuthenticatedUser();

  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;
  const skip = (page - 1) * limit;
  const now = new Date();

  const where: Record<string, unknown> = {};
  if (params?.upcoming) where.scheduledAt = { gte: now };
  if (params?.branchId) where.branchId = params.branchId;

  const [items, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { scheduledAt: "asc" },
      include: {
        customer: { select: { name: true, phone: true } },
        vehicle: { select: { numberPlate: true } },
        branch: { select: { name: true } },
      },
    }),
    prisma.appointment.count({ where }),
  ]);
  return { items, total, page, totalPages: Math.ceil(total / limit) };
}

export async function createAppointment(formData: FormData) {
  await requireRole(["Admin", "Manager"]);

  const branchId = formData.get("branchId") as string || await getSelectedBranchId();
  if (!branchId) throw new Error("No branch selected. Please select a branch first.");
  validateId(branchId);

  const raw = Object.fromEntries(formData.entries());
  const parsed = createAppointmentSchema.safeParse({
    customerId: raw.customerId,
    vehicleId: raw.vehicleId || null,
    scheduledAt: raw.scheduledAt,
    notes: raw.notes || undefined,
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Validation failed");
  }
  const created = await prisma.appointment.create({ data: { ...parsed.data, branchId } });
  revalidatePath("/appointments");
  return created;
}

export async function updateAppointmentStatus(id: string, status: string) {
  await requireRole(["Admin", "Manager"]);
  const safeId = validateId(id);
  const updated = await prisma.appointment.update({ where: { id: safeId }, data: { status } });
  revalidatePath("/appointments");
  return updated;
}

export async function deleteAppointment(id: string) {
  await requireRole(["Admin"]);
  const safeId = validateId(id);
  await prisma.appointment.delete({ where: { id: safeId } });
  revalidatePath("/appointments");
}


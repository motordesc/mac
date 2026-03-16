"use server";

import { prisma } from "@/lib/prisma";
import { createVehicleSchema, updateVehicleSchema } from "@/lib/validations/vehicle";
import { revalidatePath } from "next/cache";
import { requireRole, requireAuthenticatedUser } from "@/lib/actions/auth-guard";
import { validateId } from "@/lib/utils/validate-id";

export async function getVehicles(params: {
  search?: string;
  page?: number;
  limit?: number;
}) {
  await requireAuthenticatedUser();

  const page  = params.page ?? 1;
  const limit = params.limit ?? 20;
  const skip  = (page - 1) * limit;

  const where = params.search
    ? {
        OR: [
          { numberPlate: { contains: params.search, mode: "insensitive" as const } },
          { make:        { contains: params.search, mode: "insensitive" as const } },
          { model:       { contains: params.search, mode: "insensitive" as const } },
          { customer: { name: { contains: params.search, mode: "insensitive" as const } } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      skip,
      take: limit,
      orderBy: { numberPlate: "asc" },
      include: {
        customer: { select: { name: true, phone: true } },
        // Include latest job card for status display
        jobCards: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            status: true,
            createdAt: true,
            invoice: { select: { status: true } },
          },
        },
      },
    }),
    prisma.vehicle.count({ where }),
  ]);

  return { items, total, page, totalPages: Math.ceil(total / limit) };
}

export async function getVehicleById(id: string) {
  await requireAuthenticatedUser();
  const safeId = validateId(id);

  return prisma.vehicle.findUnique({
    where: { id: safeId },
    include: {
      customer: true,
      jobCards: {
        orderBy: { createdAt: "desc" },
        include: {
          technician: true,
          invoice:    { select: { id: true, status: true, total: true } },
          payments:   { select: { amount: true, method: true, paidAt: true } },
        },
      },
    },
  });
}

export async function createVehicle(formData: FormData) {
  await requireRole(["Admin", "Manager"]);

  const raw    = Object.fromEntries(formData.entries());
  const parsed = createVehicleSchema.safeParse({
    customerId:  raw.customerId,
    numberPlate: raw.numberPlate,
    make:        raw.make || undefined,
    model:       raw.model || undefined,
    year:        raw.year ? Number(raw.year) : null,
    vin:         raw.vin || null,
  });
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    throw new Error(firstIssue?.message ?? "Validation failed");
  }
  const created = await prisma.vehicle.create({ data: parsed.data });
  revalidatePath("/vehicles");
  revalidatePath(`/customers/${parsed.data.customerId}`);
  return created;
}

export async function updateVehicle(id: string, formData: FormData) {
  await requireRole(["Admin", "Manager"]);
  const safeId = validateId(id);

  const raw    = Object.fromEntries(formData.entries());
  const parsed = updateVehicleSchema.safeParse({
    numberPlate: raw.numberPlate,
    make:        raw.make || undefined,
    model:       raw.model || undefined,
    year:        raw.year ? Number(raw.year) : null,
    vin:         raw.vin || null,
  });
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    throw new Error(firstIssue?.message ?? "Validation failed");
  }
  const updated = await prisma.vehicle.update({
    where: { id: safeId },
    data:  parsed.data,
  });
  revalidatePath("/vehicles");
  revalidatePath(`/vehicles/${safeId}`);
  return updated;
}

export async function deleteVehicle(id: string) {
  await requireRole(["Admin"]);
  const safeId = validateId(id);
  await prisma.vehicle.delete({ where: { id: safeId } });
  revalidatePath("/vehicles");
}

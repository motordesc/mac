"use server";

import { prisma } from "@/lib/prisma";
import { createVehicleSchema, updateVehicleSchema } from "@/lib/validations/vehicle";
import { revalidatePath } from "next/cache";

export async function getVehicles(params: {
  search?: string;
  page?: number;
  limit?: number;
}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const skip = (page - 1) * limit;
  const where = params.search
    ? {
        OR: [
          { numberPlate: { contains: params.search, mode: "insensitive" as const } },
          { make: { contains: params.search, mode: "insensitive" as const } },
          { model: { contains: params.search, mode: "insensitive" as const } },
        ],
      }
    : {};
  const [items, total] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      skip,
      take: limit,
      orderBy: { numberPlate: "asc" },
      include: { customer: { select: { name: true, phone: true } } },
    }),
    prisma.vehicle.count({ where }),
  ]);
  return { items, total, page, totalPages: Math.ceil(total / limit) };
}

export async function getVehicleById(id: string) {
  return prisma.vehicle.findUnique({
    where: { id },
    include: {
      customer: true,
      jobCards: { orderBy: { createdAt: "desc" }, include: { technician: true } },
    },
  });
}

export async function createVehicle(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = createVehicleSchema.safeParse({
    customerId: raw.customerId,
    numberPlate: raw.numberPlate,
    make: raw.make,
    model: raw.model,
    year: raw.year ? Number(raw.year) : null,
    vin: raw.vin || null,
  });
  if (!parsed.success) throw new Error(parsed.error.flatten().message as unknown as string);
  const created = await prisma.vehicle.create({ data: parsed.data });
  revalidatePath("/vehicles");
  revalidatePath(`/customers/${parsed.data.customerId}`);
  return created;
}

export async function updateVehicle(id: string, formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = updateVehicleSchema.safeParse({
    numberPlate: raw.numberPlate,
    make: raw.make,
    model: raw.model,
    year: raw.year ? Number(raw.year) : null,
    vin: raw.vin || null,
  });
  if (!parsed.success) throw new Error(parsed.error.flatten().message as unknown as string);
  const updated = await prisma.vehicle.update({
    where: { id },
    data: parsed.data,
  });
  revalidatePath("/vehicles");
  revalidatePath(`/vehicles/${id}`);
  return updated;
}

export async function deleteVehicle(id: string) {
  await prisma.vehicle.delete({ where: { id } });
  revalidatePath("/vehicles");
}

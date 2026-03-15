"use server";

import { prisma } from "@/lib/prisma";
import { createJobCardSchema, updateJobCardSchema } from "@/lib/validations/jobcard";
import { revalidatePath } from "next/cache";

export async function getJobCards(params: {
  status?: string;
  page?: number;
  limit?: number;
}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const skip = (page - 1) * limit;
  const where = params.status
    ? { status: params.status as "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CLOSED" }
    : {};
  const [items, total] = await Promise.all([
    prisma.jobCard.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        vehicle: { select: { numberPlate: true, make: true, model: true } },
        customer: { select: { name: true, phone: true } },
        technician: { select: { name: true } },
      },
    }),
    prisma.jobCard.count({ where }),
  ]);
  return { items, total, page, totalPages: Math.ceil(total / limit) };
}

export async function getJobCardById(id: string) {
  return prisma.jobCard.findUnique({
    where: { id },
    include: {
      vehicle: true,
      customer: true,
      technician: true,
      services: { include: { service: true } },
      parts: { include: { inventoryItem: true } },
      invoice: true,
      payments: true,
      images: true,
    },
  });
}

export async function createJobCard(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = createJobCardSchema.safeParse({
    vehicleId: raw.vehicleId,
    customerId: raw.customerId,
    technicianId: raw.technicianId || null,
    status: raw.status || "OPEN",
    estimatedCost: raw.estimatedCost ? Number(raw.estimatedCost) : null,
    notes: raw.notes || null,
    serviceDueDate: raw.serviceDueDate || null,
  });
  if (!parsed.success) throw new Error(parsed.error.flatten().message as unknown as string);
  const created = await prisma.jobCard.create({ data: parsed.data });
  revalidatePath("/jobcards");
  revalidatePath("/dashboard");
  return created;
}

export async function updateJobCard(id: string, formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = updateJobCardSchema.safeParse({
    vehicleId: raw.vehicleId,
    customerId: raw.customerId,
    technicianId: raw.technicianId || null,
    status: raw.status,
    estimatedCost: raw.estimatedCost ? Number(raw.estimatedCost) : null,
    notes: raw.notes || null,
    serviceDueDate: raw.serviceDueDate || null,
  });
  if (!parsed.success) throw new Error(parsed.error.flatten().message as unknown as string);
  const data = { ...parsed.data } as Record<string, unknown>;
  if (data.estimatedCost === null) data.estimatedCost = null;
  const updated = await prisma.jobCard.update({
    where: { id },
    data: data as Parameters<typeof prisma.jobCard.update>[0]["data"],
  });
  revalidatePath("/jobcards");
  revalidatePath(`/jobcards/${id}`);
  revalidatePath("/dashboard");
  return updated;
}

export async function deleteJobCard(id: string) {
  await prisma.jobCard.delete({ where: { id } });
  revalidatePath("/jobcards");
  revalidatePath("/dashboard");
}

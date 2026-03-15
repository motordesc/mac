"use server";

import { prisma } from "@/lib/prisma";
import { createCustomerSchema, updateCustomerSchema } from "@/lib/validations/customer";
import { revalidatePath } from "next/cache";

export async function getCustomers(params: { search?: string; page?: number; limit?: number }) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const skip = (page - 1) * limit;
  const where = params.search
    ? {
        OR: [
          { name: { contains: params.search, mode: "insensitive" as const } },
          { phone: { contains: params.search, mode: "insensitive" as const } },
        ],
      }
    : {};
  const [items, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: "asc" },
      include: { _count: { select: { vehicles: true, jobCards: true } } },
    }),
    prisma.customer.count({ where }),
  ]);
  return { items, total, page, totalPages: Math.ceil(total / limit) };
}

export async function getCustomerById(id: string) {
  return prisma.customer.findUnique({
    where: { id },
    include: {
      vehicles: true,
      jobCards: { take: 10, orderBy: { createdAt: "desc" }, include: { vehicle: true } },
      invoices: { take: 5, orderBy: { createdAt: "desc" } },
    },
  });
}

export async function createCustomer(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = createCustomerSchema.safeParse({
    name: raw.name,
    phone: raw.phone,
    address: raw.address,
  });
  if (!parsed.success) throw new Error(parsed.error.flatten().message as unknown as string);
  const created = await prisma.customer.create({ data: parsed.data });
  revalidatePath("/customers");
  return created;
}

export async function updateCustomer(id: string, formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = updateCustomerSchema.safeParse({
    name: raw.name,
    phone: raw.phone,
    address: raw.address,
  });
  if (!parsed.success) throw new Error(parsed.error.flatten().message as unknown as string);
  const updated = await prisma.customer.update({
    where: { id },
    data: parsed.data,
  });
  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
  return updated;
}

export async function deleteCustomer(id: string) {
  await prisma.customer.delete({ where: { id } });
  revalidatePath("/customers");
}

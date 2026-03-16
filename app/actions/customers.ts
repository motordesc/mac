"use server";

import { prisma } from "@/lib/prisma";
import { createCustomerSchema, updateCustomerSchema } from "@/lib/validations/customer";
import { revalidatePath } from "next/cache";
import { requireRole, requireAuthenticatedUser } from "@/lib/actions/auth-guard";
import { validateId } from "@/lib/utils/validate-id";

export async function getCustomers(params: { search?: string; page?: number; limit?: number }) {
  await requireAuthenticatedUser();

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
      select: {
        id: true,
        name: true,
        phone: true,
        address: true,
        _count: { select: { vehicles: true, jobCards: true } },
      },
    }),
    prisma.customer.count({ where }),
  ]);
  return { items, total, page, totalPages: Math.ceil(total / limit) };
}

export async function getCustomerById(id: string) {
  await requireAuthenticatedUser();
  const safeId = validateId(id);

  return prisma.customer.findUnique({
    where: { id: safeId },
    include: {
      vehicles: true,
      jobCards: { take: 10, orderBy: { createdAt: "desc" }, include: { vehicle: true } },
      invoices: { take: 5, orderBy: { createdAt: "desc" } },
    },
  });
}

export async function createCustomer(formData: FormData) {
  await requireRole(["Admin", "Manager"]);

  const raw = Object.fromEntries(formData.entries());
  const parsed = createCustomerSchema.safeParse({
    name: raw.name,
    phone: raw.phone,
    address: raw.address || undefined,
  });
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    throw new Error(firstIssue?.message ?? "Validation failed");
  }
  const created = await prisma.customer.create({ data: parsed.data });
  revalidatePath("/customers");
  return created;
}

export async function updateCustomer(id: string, formData: FormData) {
  await requireRole(["Admin", "Manager"]);
  const safeId = validateId(id);

  const raw = Object.fromEntries(formData.entries());
  const parsed = updateCustomerSchema.safeParse({
    name: raw.name,
    phone: raw.phone,
    address: raw.address || undefined,
  });
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    throw new Error(firstIssue?.message ?? "Validation failed");
  }
  const updated = await prisma.customer.update({
    where: { id: safeId },
    data: parsed.data,
  });
  revalidatePath("/customers");
  revalidatePath(`/customers/${safeId}`);
  return updated;
}

export async function deleteCustomer(id: string) {
  await requireRole(["Admin"]);
  const safeId = validateId(id);

  await prisma.customer.delete({ where: { id: safeId } });
  revalidatePath("/customers");
}

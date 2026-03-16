"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireRole, requireAuthenticatedUser } from "@/lib/actions/auth-guard";
import { z } from "zod";
import type { GarageSettings } from "@prisma/client";

const settingsSchema = z.object({
  garage_name: z.string().min(1, "Garage name is required").max(100),
  tax_rate: z.coerce.number().min(0).max(100),
});

export async function getGarageSettings() {
  await requireAuthenticatedUser();
  const settings = await prisma.garageSettings.findMany();
  return {
    garageName: settings.find((s: GarageSettings) => s.key === "garage_name")?.value ?? "Motor Auto Care",
    taxRate: settings.find((s: GarageSettings) => s.key === "tax_rate")?.value ?? "18",
  };
}

export async function saveGarageSettings(formData: FormData) {
  await requireRole(["Admin"]);

  const raw = Object.fromEntries(formData.entries());
  const parsed = settingsSchema.safeParse({
    garage_name: raw.garage_name,
    tax_rate: raw.tax_rate,
  });
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    throw new Error(firstIssue?.message ?? "Validation failed");
  }

  await Promise.all([
    prisma.garageSettings.upsert({
      where: { key: "garage_name" },
      create: { key: "garage_name", value: parsed.data.garage_name },
      update: { value: parsed.data.garage_name },
    }),
    prisma.garageSettings.upsert({
      where: { key: "tax_rate" },
      create: { key: "tax_rate", value: String(parsed.data.tax_rate) },
      update: { value: String(parsed.data.tax_rate) },
    }),
  ]);

  revalidatePath("/settings");
}

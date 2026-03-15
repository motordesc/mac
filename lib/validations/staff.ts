import { z } from "zod";

export const staffRoleEnum = z.enum(["MECHANIC", "MANAGER", "ADMIN", "HELPER"]);

export const createStaffSchema = z.object({
  name: z.string().min(1, "Name is required"),
  role: staffRoleEnum,
  phone: z.string().optional(),
});

export const updateStaffSchema = createStaffSchema.partial();

export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;

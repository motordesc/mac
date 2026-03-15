import { z } from "zod";

export const jobCardStatusEnum = z.enum(["OPEN", "IN_PROGRESS", "COMPLETED", "CLOSED"]);

export const createJobCardSchema = z.object({
  vehicleId: z.string().uuid(),
  customerId: z.string().uuid(),
  technicianId: z.string().uuid().optional().nullable(),
  status: jobCardStatusEnum.default("OPEN"),
  estimatedCost: z.coerce.number().min(0).optional().nullable(),
  notes: z.string().optional().nullable(),
  serviceDueDate: z.coerce.date().optional().nullable(),
});

export const updateJobCardSchema = createJobCardSchema.partial();

export type CreateJobCardInput = z.infer<typeof createJobCardSchema>;
export type UpdateJobCardInput = z.infer<typeof updateJobCardSchema>;

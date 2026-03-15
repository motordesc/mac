import { z } from "zod";

export const createVehicleSchema = z.object({
  customerId: z.string().uuid(),
  numberPlate: z.string().min(1, "Number plate is required"),
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.coerce.number().int().min(1900).max(2100).optional().nullable(),
  vin: z.string().optional().nullable(),
});

export const updateVehicleSchema = createVehicleSchema.partial().omit({ customerId: true });

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;

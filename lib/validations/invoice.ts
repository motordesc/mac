import { z } from "zod";

export const invoiceItemSchema = z.object({
  description: z.string(),
  quantity: z.coerce.number().int().min(1),
  unitPrice: z.coerce.number().min(0),
  type: z.enum(["SERVICE", "PART"]),
});

export const createInvoiceSchema = z.object({
  jobCardId: z.string().uuid().optional(),
  customerId: z.string().uuid(),
  items: z.array(invoiceItemSchema).min(1),
  tax: z.coerce.number().min(0).default(0),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

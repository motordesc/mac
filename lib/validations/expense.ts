import { z } from "zod";

export const expenseCategoryEnum = z.enum(["RENT", "ELECTRICITY", "TOOLS", "SUPPLIES", "OTHER"]);

export const createExpenseSchema = z.object({
  category: expenseCategoryEnum,
  amount: z.coerce.number().min(0),
  date: z.coerce.date(),
  description: z.string().optional(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;

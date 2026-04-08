import { z } from "zod";

export const budgetSchema = z.object({
  category_id: z.string().uuid().optional().nullable(),
  amount: z.number().positive("Amount must be greater than 0"),
  currency: z.enum(["USD", "JOD"]),
  period: z.enum(["monthly", "weekly"]).default("monthly"),
});

export type BudgetInput = z.infer<typeof budgetSchema>;

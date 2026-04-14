import { z } from "zod";

export const budgetSchema = z.object({
  category_id: z.string().uuid().optional().nullable(),
  amount: z.number().positive("Amount must be greater than 0"),
  currency: z.enum(["USD", "JOD", "EUR", "GBP", "SAR", "AED", "EGP", "TRY", "IQD", "KWD", "BHD", "OMR", "QAR", "LBP", "SYP", "YER", "MAD", "TND", "DZD", "LYD", "SDG"]),
  period: z.enum(["monthly", "weekly"]).default("monthly"),
});

export type BudgetInput = z.infer<typeof budgetSchema>;

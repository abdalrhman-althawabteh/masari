import { z } from "zod";

export const transactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.number().positive("Amount must be greater than 0"),
  currency: z.enum(["USD", "JOD"]),
  category_id: z.string().uuid("Please select a category"),
  description: z.string().min(1, "Description is required").max(500),
  source: z.string().max(200).optional().nullable(),
  date: z.string(),
  is_subscription: z.boolean().default(false),
});

export type TransactionInput = z.infer<typeof transactionSchema>;

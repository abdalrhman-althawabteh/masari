import { z } from "zod";

export const subscriptionSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  amount: z.number().positive("Amount must be greater than 0"),
  currency: z.enum(["USD", "JOD"]),
  category_id: z.string().uuid("Please select a category"),
  billing_cycle: z.enum(["monthly", "yearly", "weekly", "custom"]),
  billing_day: z.number().min(1).max(31).optional().nullable(),
  next_billing_date: z.string().min(1, "Next billing date is required"),
  status: z.enum(["active", "paused", "cancelled"]).default("active"),
  notes: z.string().max(1000).optional().nullable(),
});

export type SubscriptionInput = z.infer<typeof subscriptionSchema>;

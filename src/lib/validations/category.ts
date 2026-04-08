import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  icon: z.string().max(10).optional().nullable(),
  type: z.enum(["income", "expense", "both"]),
});

export type CategoryInput = z.infer<typeof categorySchema>;

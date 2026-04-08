"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { categorySchema, type CategoryInput } from "@/lib/validations/category";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Category } from "@/types/database";

interface CategoryFormProps {
  category?: Category;
  onSubmit: (data: CategoryInput) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function CategoryForm({ category, onSubmit, onCancel, loading }: CategoryFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name || "",
      icon: category?.icon || "",
      type: (category?.type as "income" | "expense" | "both") || "expense",
    },
  });

  const type = watch("type");

  function handleFormSubmit(data: Record<string, unknown>) {
    return onSubmit(data as unknown as CategoryInput);
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" placeholder="Category name" {...register("name")} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="icon">Icon (emoji)</Label>
        <Input id="icon" placeholder="e.g. 🍔" {...register("icon")} className="w-20" />
      </div>

      <div className="space-y-2">
        <Label>Type</Label>
        <Select value={type} onValueChange={(val) => setValue("type", val as "income" | "expense" | "both")}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="expense">Expense</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="both">Both</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : category ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
}

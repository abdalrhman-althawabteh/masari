"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Topbar } from "@/components/layout/topbar";
import { CategoryForm } from "@/components/categories/category-form";
import { Skeleton } from "@/components/ui/skeleton";
import type { Category } from "@/types/database";
import type { CategoryInput } from "@/lib/validations/category";
import { toast } from "sonner";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>();

  const fetchCategories = useCallback(async () => {
    const res = await fetch("/api/categories");
    if (res.ok) {
      setCategories(await res.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const expenseCategories = categories.filter((c) => c.type === "expense" || c.type === "both");
  const incomeCategories = categories.filter((c) => c.type === "income" || c.type === "both");

  async function handleSubmit(data: CategoryInput) {
    setSaving(true);
    const url = editingCategory
      ? `/api/categories/${editingCategory.id}`
      : "/api/categories";
    const method = editingCategory ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      toast.success(editingCategory ? "Category updated" : "Category created");
      setDialogOpen(false);
      setEditingCategory(undefined);
      fetchCategories();
    } else {
      const err = await res.json();
      toast.error(err.error || "Something went wrong");
    }
    setSaving(false);
  }

  async function handleDelete(category: Category) {
    if (!confirm(`Delete "${category.name}"?`)) return;

    const res = await fetch(`/api/categories/${category.id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      toast.success("Category deleted");
      fetchCategories();
    } else {
      const err = await res.json();
      toast.error(err.error || "Something went wrong");
    }
  }

  function openCreate() {
    setEditingCategory(undefined);
    setDialogOpen(true);
  }

  function openEdit(category: Category) {
    setEditingCategory(category);
    setDialogOpen(true);
  }

  return (
    <>
      <Topbar title="Categories">
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Category
        </Button>
      </Topbar>

      <div className="p-4 lg:p-6 space-y-6">
        <CategorySection
          title="Expense Categories"
          categories={expenseCategories}
          loading={loading}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
        <CategorySection
          title="Income Categories"
          categories={incomeCategories}
          loading={loading}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Category" : "New Category"}
            </DialogTitle>
          </DialogHeader>
          <CategoryForm
            category={editingCategory}
            onSubmit={handleSubmit}
            onCancel={() => setDialogOpen(false)}
            loading={saving}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function CategorySection({
  title,
  categories,
  loading,
  onEdit,
  onDelete,
}: {
  title: string;
  categories: Category[];
  loading: boolean;
  onEdit: (c: Category) => void;
  onDelete: (c: Category) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">No categories yet.</p>
        ) : (
          <div className="space-y-1">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-accent/50 group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{category.icon || "📁"}</span>
                  <span className="text-sm font-medium">{category.name}</span>
                  {category.is_default && (
                    <Badge variant="secondary" className="text-xs">
                      Default
                    </Badge>
                  )}
                </div>
                {!category.is_default && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onEdit(category)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => onDelete(category)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

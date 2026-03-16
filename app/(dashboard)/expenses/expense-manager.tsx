"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createExpenseSchema, type CreateExpenseInput } from "@/lib/validations/expense";
import { createExpense, deleteExpense } from "@/app/actions/expenses";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

type Expense = {
  id: string;
  category: string;
  amount: { toString(): string };
  date: Date;
  description: string | null;
};

export function ExpenseManager({
  expenses,
  canManage,
}: {
  expenses: Expense[];
  canManage: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreateExpenseInput>({
    resolver: zodResolver(createExpenseSchema) as any,
    defaultValues: { category: "OTHER", amount: 0, date: new Date(), description: "" },
  });

  async function onSubmit(data: CreateExpenseInput) {
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.set("category", data.category);
        fd.set("amount", String(data.amount));
        fd.set("date", new Date(data.date).toISOString());
        if (data.description) fd.set("description", data.description);
        await createExpense(fd);
        toast.success("Expense recorded");
        form.reset();
        setOpen(false);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to save expense");
      }
    });
  }

  function handleDelete(id: string) {
    setDeletingId(id);
    startTransition(async () => {
      try {
        await deleteExpense(id);
        toast.success("Expense deleted");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to delete");
      } finally {
        setDeletingId(null);
      }
    });
  }

  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Total: <span className="font-semibold text-foreground">{formatCurrency(total)}</span>
        </p>
        {canManage && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" disabled={isPending}>
                <Plus className="mr-2 size-4" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Expense</DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    onValueChange={(v) => form.setValue("category", v as CreateExpenseInput["category"])}
                    defaultValue="OTHER"
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Amount (₹)</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    {...form.register("amount", { valueAsNumber: true })}
                  />
                  {form.formState.errors.amount && (
                    <p className="text-sm text-destructive">{form.formState.errors.amount.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" {...form.register("date")} />
                  {form.formState.errors.date && (
                    <p className="text-sm text-destructive">{form.formState.errors.date.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea {...form.register("description")} className="min-h-[60px]" />
                  {form.formState.errors.description && (
                    <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
                  )}
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? "Saving…" : "Save Expense"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {expenses.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">No expenses recorded.</p>
      ) : (
        <div className="space-y-3">
          {expenses.map((e) => (
            <div
              key={e.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-4"
            >
              <div>
                <p className="font-medium">{e.category}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(e.date)}{e.description ? ` · ${e.description}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-medium">{formatCurrency(Number(e.amount))}</span>
                {canManage && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-destructive hover:bg-destructive/10"
                    disabled={isPending && deletingId === e.id}
                    onClick={() => handleDelete(e.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

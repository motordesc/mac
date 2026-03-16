"use client";

import { useTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createStaffSchema, type CreateStaffInput } from "@/lib/validations/staff";
import { createStaff, deleteStaff } from "@/app/actions/staff";
import { STAFF_ROLES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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

type StaffMember = {
  id: string;
  name: string;
  role: string;
  phone: string | null;
  _count: { jobCards: number };
};

export function StaffManager({ staff, isAdmin }: { staff: StaffMember[]; isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreateStaffInput>({
    resolver: zodResolver(createStaffSchema),
    defaultValues: { name: "", role: "MECHANIC", phone: "" },
  });

  async function onSubmit(data: CreateStaffInput) {
    try {
      const fd = new FormData();
      fd.set("name", data.name);
      fd.set("role", data.role);
      if (data.phone) fd.set("phone", data.phone);
      await createStaff(fd);
      toast.success("Staff member added");
      form.reset();
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add staff");
    }
  }

  function handleDelete(id: string) {
    setDeletingId(id);
    startTransition(async () => {
      try {
        await deleteStaff(id);
        toast.success("Staff member removed");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to delete");
      } finally {
        setDeletingId(null);
      }
    });
  }

  const roleColors: Record<string, string> = {
    MECHANIC: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    MANAGER: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    ADMIN: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    HELPER: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  };

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="flex justify-end">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 size-4" />
                Add Staff
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Staff Member</DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="staff-name">Name</Label>
                  <Input id="staff-name" {...form.register("name")} />
                  {form.formState.errors.name && (
                    <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staff-role">Role</Label>
                  <Select
                    onValueChange={(v) => form.setValue("role", v as CreateStaffInput["role"])}
                    defaultValue="MECHANIC"
                  >
                    <SelectTrigger id="staff-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STAFF_ROLES.map((r: any) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staff-phone">Phone</Label>
                  <Input id="staff-phone" {...form.register("phone")} placeholder="+91..." />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? "Adding…" : "Add Staff"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {staff.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">No staff added yet.</p>
      ) : (
        <div className="space-y-3">
          {staff.map((s: any) => (
            <div
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-4"
            >
              <div className="flex items-center gap-3">
                <div>
                  <p className="font-medium">{s.name}</p>
                  <p className="text-sm text-muted-foreground">{s.phone ?? "No phone"}</p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${roleColors[s.role] ?? ""}`}
                >
                  {s.role}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">{s._count.jobCards} job cards</span>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-destructive hover:bg-destructive/10"
                    disabled={isPending && deletingId === s.id}
                    onClick={() => handleDelete(s.id)}
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

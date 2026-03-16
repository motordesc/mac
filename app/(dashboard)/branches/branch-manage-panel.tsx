"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import {
  createBranch,
  updateBranch,
  deleteBranch,
  assignUserToBranch,
  removeUserFromBranch,
} from "@/app/actions/branches";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, UserPlus, UserMinus, GitBranch } from "lucide-react";

type BranchWithCount = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  _count: { jobCards: number; staff: number; userBranches: number };
};
type AppUser = {
  id: string;
  name: string | null;
  email: string | null;
  role: { name: string } | null;
};

type FormData = { name: string; address: string; phone: string; email: string };

export function BranchManagePanel({
  branches: initialBranches,
  allUsers,
}: {
  branches: BranchWithCount[];
  allUsers: AppUser[];
}) {
  const [branches, setBranches] = useState(initialBranches);
  const [createOpen, setCreateOpen] = useState(false);
  const [editBranch, setEditBranch] = useState<BranchWithCount | null>(null);
  const [assignBranch, setAssignBranch] = useState<BranchWithCount | null>(null);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormData>({ defaultValues: { name: "", address: "", phone: "", email: "" } });

  // ── Create ──────────────────────────────────────────────────────────────
  async function onCreateSubmit(data: FormData) {
    try {
      const fd = new FormData();
      fd.set("name", data.name);
      if (data.address) fd.set("address", data.address);
      if (data.phone) fd.set("phone", data.phone);
      if (data.email) fd.set("email", data.email);
      const created = await createBranch(fd);
      toast.success(`Branch "${created.name}" created`);
      setBranches((prev) => [
        ...prev,
        { ...created, _count: { jobCards: 0, staff: 0, userBranches: 0 } },
      ]);
      form.reset();
      setCreateOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create");
    }
  }

  // ── Edit ────────────────────────────────────────────────────────────────
  async function onEditSubmit(data: FormData) {
    if (!editBranch) return;
    try {
      const fd = new FormData();
      fd.set("name", data.name);
      if (data.address) fd.set("address", data.address);
      if (data.phone) fd.set("phone", data.phone);
      if (data.email) fd.set("email", data.email);
      const updated = await updateBranch(editBranch.id, fd);
      setBranches((prev) =>
        prev.map((b) => (b.id === updated.id ? { ...b, ...updated } : b))
      );
      toast.success("Branch updated");
      setEditBranch(null);
      form.reset();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update");
    }
  }

  // ── Delete ──────────────────────────────────────────────────────────────
  function handleDelete(id: string, name: string) {
    startTransition(async () => {
      try {
        await deleteBranch(id);
        setBranches((prev) => prev.filter((b) => b.id !== id));
        toast.success(`Branch "${name}" archived`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to delete");
      }
    });
  }

  // ── Assign user ─────────────────────────────────────────────────────────
  async function handleAssignUser() {
    if (!assignBranch || !selectedUserId) return;
    try {
      await assignUserToBranch(selectedUserId, assignBranch.id);
      setBranches((prev) =>
        prev.map((b) =>
          b.id === assignBranch.id
            ? { ...b, _count: { ...b._count, userBranches: b._count.userBranches + 1 } }
            : b
        )
      );
      toast.success("User assigned to branch");
      setSelectedUserId("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to assign");
    }
  }

  return (
    <div className="space-y-4">
      {/* Create button */}
      <div className="flex justify-end">
        <Button
          onClick={() => {
            form.reset({ name: "", address: "", phone: "", email: "" });
            setCreateOpen(true);
          }}
        >
          <Plus className="mr-2 size-4" />
          New Branch
        </Button>
      </div>

      {/* Branch cards */}
      {branches.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <GitBranch className="mx-auto mb-3 size-10 text-muted-foreground" />
            <p className="font-medium">No branches yet</p>
            <p className="text-sm text-muted-foreground">
              Create your first branch to start organising the shop.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {branches.map((b) => (
            <Card key={b.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{b.name}</CardTitle>
                    {b.address && (
                      <p className="text-sm text-muted-foreground">{b.address}</p>
                    )}
                    {b.phone && (
                      <p className="text-sm text-muted-foreground">{b.phone}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => {
                        form.reset({
                          name: b.name,
                          address: b.address ?? "",
                          phone: b.phone ?? "",
                          email: b.email ?? "",
                        });
                        setEditBranch(b);
                      }}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:bg-destructive/10"
                      disabled={isPending}
                      onClick={() => handleDelete(b.id, b.name)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="flex gap-3 text-sm text-muted-foreground">
                  <span>{b._count.jobCards} job cards</span>
                  <span>·</span>
                  <span>{b._count.staff} staff</span>
                  <span>·</span>
                  <span>{b._count.userBranches} users</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setAssignBranch(b)}
                >
                  <UserPlus className="mr-2 size-3.5" />
                  Manage Users
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Branch</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onCreateSubmit)} className="space-y-4 pt-2">
            <BranchFormFields form={form} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Creating…" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editBranch} onOpenChange={(o) => { if (!o) setEditBranch(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Branch</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4 pt-2">
            <BranchFormFields form={form} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditBranch(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign users dialog */}
      <Dialog open={!!assignBranch} onOpenChange={(o) => { if (!o) setAssignBranch(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Users — {assignBranch?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="flex gap-2">
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select user to assign" />
                </SelectTrigger>
                <SelectContent>
                  {allUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name ?? u.email ?? u.id}
                      {u.role && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({u.role.name})
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleAssignUser} disabled={!selectedUserId}>
                <UserPlus className="size-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Assigned users will see this branch in their selector.
            </p>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setAssignBranch(null)}>
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BranchFormFields({ form }: { form: ReturnType<typeof useForm<FormData>> }) {
  return (
    <>
      <div className="space-y-2">
        <Label>Branch Name *</Label>
        <Input {...form.register("name", { required: true })} placeholder="e.g. Main Branch" />
      </div>
      <div className="space-y-2">
        <Label>Address</Label>
        <Input {...form.register("address")} placeholder="123 Main St, City" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Phone</Label>
          <Input {...form.register("phone")} placeholder="+91 98765 43210" />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input {...form.register("email")} placeholder="branch@example.com" type="email" />
        </div>
      </div>
    </>
  );
}

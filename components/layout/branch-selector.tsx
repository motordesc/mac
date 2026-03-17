"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { setSelectedBranch } from "@/app/actions/branches";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBranch } from "@/app/actions/branches";
import { toast } from "sonner";
import { GitBranch, Plus } from "lucide-react";

type Branch = { id: string; name: string };

export function BranchSelector({
  branches,
  selectedBranchId,
  isAdmin,
}: {
  branches: Branch[];
  selectedBranchId: string | null;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [creating, setCreating] = useState(false);

  function handleSelect(value: string) {
    startTransition(async () => {
      try {
        await setSelectedBranch(value === "__all__" ? null : value);
        // Full reload to ensure all server components re-fetch with the new branch cookie
        window.location.reload();
      } catch {
        toast.error("Could not switch branch");
      }
    });
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const fd = new FormData();
      fd.set("name", newName.trim());
      if (newAddress.trim()) fd.set("address", newAddress.trim());
      const branch = await createBranch(fd);
      toast.success(`Branch "${branch.name}" created`);
      setNewName("");
      setNewAddress("");
      setCreateOpen(false);
      // Auto-select the new branch
      await setSelectedBranch(branch.id);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create branch");
    } finally {
      setCreating(false);
    }
  }

  // No branches exist yet — show create prompt (admin) or placeholder
  if (branches.length === 0) {
    if (!isAdmin) {
      return (
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-1.5 text-sm text-muted-foreground">
          <GitBranch className="size-4" />
          No branches yet
        </div>
      );
    }
    return (
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="size-4" />
            Add Branch
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create First Branch</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Branch Name</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Main Branch, Downtown"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Address (optional)</Label>
              <Input
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                placeholder="123 Main St, City"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={creating || !newName.trim()}>
                {creating ? "Creating…" : "Create Branch"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <GitBranch className="size-4 text-muted-foreground" />
      <Select
        value={selectedBranchId ?? "__all__"}
        onValueChange={handleSelect}
        disabled={isPending}
      >
        <SelectTrigger className="h-8 w-[180px] text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">
            <span className="font-medium">All Branches</span>
          </SelectItem>
          {branches.map((b: any) => (
            <SelectItem key={b.id} value={b.id}>
              {b.name}
            </SelectItem>
          ))}
          {isAdmin && (
            <>
              <div className="my-1 border-t border-border" />
              <div
                className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="size-3.5" />
                Add branch
              </div>
            </>
          )}
        </SelectContent>
      </Select>

      {/* Quick-create dialog (triggered from inside Select) */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Branch</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Branch Name</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. East Wing, Branch 2"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Address (optional)</Label>
              <Input
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                placeholder="123 Main St, City"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={creating || !newName.trim()}>
                {creating ? "Creating…" : "Create Branch"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

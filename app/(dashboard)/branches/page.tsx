import { getBranches } from "@/app/actions/branches";
import { getCurrentRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BranchManagePanel } from "./branch-manage-panel";
import { redirect } from "next/navigation";

export const metadata = { title: "Branches | Motor Auto Care" };

export default async function BranchesPage() {
  const role = await getCurrentRole();

  // Only Admins can manage branches; others redirect to dashboard
  if (role !== "Admin") redirect("/dashboard");

  const [branches, allUsers] = await Promise.all([
    getBranches(),
    prisma.user.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, role: { select: { name: true } } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Branch Management</h1>
          <p className="text-sm text-muted-foreground">
            Create and manage branches. Assign staff and users to each branch.
          </p>
        </div>
      </div>

      <BranchManagePanel branches={branches} allUsers={allUsers} />
    </div>
  );
}

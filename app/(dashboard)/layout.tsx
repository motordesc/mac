import { redirect } from "next/navigation";
import { getCurrentUser, getCurrentRole } from "@/lib/auth";
import { getSelectedBranchId } from "@/lib/branch";
import { prisma } from "@/lib/prisma";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { MobileNav } from "@/components/layout/mobile-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/pending-access");

  const [branches, selectedBranchId, role] = await Promise.all([
    prisma.branch.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    getSelectedBranchId(),
    getCurrentRole(),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppSidebar />
      <div className="flex flex-1 flex-col md:pl-64">
        <AppTopbar
          branches={branches}
          selectedBranchId={selectedBranchId}
          isAdmin={role === "Admin"}
        />
        {/* pb-20 on mobile gives space above the bottom nav bar */}
        <main className="flex-1 p-4 pb-24 md:pb-6 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}


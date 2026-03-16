import { prisma } from "@/lib/prisma";
import { getSelectedBranchId } from "@/lib/branch";
import { getGarageSettings } from "@/app/actions/settings";
import { QuickSaleWizard } from "./quick-sale-wizard";
import { Card, CardContent } from "@/components/ui/card";
import { GitBranch } from "lucide-react";

export const metadata = { title: "Quick Sale | Motor Auto Care" };

export default async function SellPage() {
  const branchId = await getSelectedBranchId();

  // Services catalog (global — not branch-scoped)
  const [services, inventory, staff, settings] = await Promise.all([
    prisma.service.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, defaultPrice: true } }),
    prisma.inventoryItem.findMany({
      where: branchId ? { branchId } : {},
      orderBy: { name: "asc" },
      select: { id: true, name: true, sku: true, sellingPrice: true, quantity: true },
    }),
    prisma.staff.findMany({
      where: branchId ? { branchId } : {},
      orderBy: { name: "asc" },
      select: { id: true, name: true, role: true },
    }),
    getGarageSettings(),
  ]);

  const taxRate = parseFloat(settings.taxRate ?? "0");

  if (!branchId) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="max-w-sm w-full">
          <CardContent className="pt-8 pb-8 text-center space-y-3">
            <GitBranch className="mx-auto size-10 text-muted-foreground" />
            <p className="font-semibold text-lg">Select a Branch First</p>
            <p className="text-sm text-muted-foreground">
              Use the branch selector in the top bar to choose a branch before making a sale.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Quick Sale</h1>
        <p className="text-sm text-muted-foreground">
          Customer → Vehicle → Services &amp; Parts → Payment. Done in under a minute.
        </p>
      </div>
      <QuickSaleWizard
        services={services}
        inventory={inventory}
        staff={staff}
        defaultTaxRate={taxRate}
      />
    </div>
  );
}

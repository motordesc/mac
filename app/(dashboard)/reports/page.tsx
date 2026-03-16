import { prisma } from "@/lib/prisma";
import { getSelectedBranchId } from "@/lib/branch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { startOfDay, startOfWeek, startOfMonth, subDays } from "date-fns";
import { ReportDownloads } from "./report-downloads";

export default async function ReportsPage() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);
  const branchId = await getSelectedBranchId();
  const branchWhere = branchId ? { branchId } : {};

  const branchName = branchId
    ? await prisma.branch
        .findUnique({ where: { id: branchId }, select: { name: true } })
        .then((b) => b?.name ?? "Branch")
    : null;

  const branches = await prisma.branch.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const [
    dailyRevenue,
    weeklyRevenue,
    monthlyRevenue,
    jobCardsCount,
    expensesTotal,
    topStaff,
    openJobCards,
    completedJobCards,
    inventoryAlerts,
  ] = await Promise.all([
    prisma.payment.aggregate({ where: { ...branchWhere, paidAt: { gte: todayStart } }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { ...branchWhere, paidAt: { gte: weekStart } }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { ...branchWhere, paidAt: { gte: monthStart } }, _sum: { amount: true } }),
    prisma.jobCard.count({ where: { ...branchWhere, createdAt: { gte: subDays(now, 30) } } }),
    prisma.expense.aggregate({ where: { ...branchWhere, date: { gte: monthStart } }, _sum: { amount: true } }),
    prisma.jobCard
      .groupBy({
        by: ["technicianId"],
        where: { ...branchWhere, status: "CLOSED", updatedAt: { gte: monthStart } },
        _count: true,
        orderBy: { _count: { technicianId: "desc" } },
        take: 5,
      })
      .then(async (groups) => {
        const ids = groups.map((g) => g.technicianId).filter(Boolean) as string[];
        const staff = await prisma.staff.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } });
        const map = new Map(staff.map((s) => [s.id, s.name]));
        return groups.map((g) => ({
          name: g.technicianId ? (map.get(g.technicianId) ?? "Unassigned") : "Unassigned",
          closed: g._count,
        }));
      }),
    prisma.jobCard.count({ where: { ...branchWhere, status: "OPEN" } }),
    prisma.jobCard.count({ where: { ...branchWhere, status: { in: ["COMPLETED", "CLOSED"] } } }),
    prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*)::bigint AS count FROM "InventoryItem" WHERE quantity <= "minQuantity"
    `.then((r) => Number(r[0].count)),
  ]);

  const netProfit =
    Number(monthlyRevenue._sum.amount ?? 0) - Number(expensesTotal._sum.amount ?? 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Reports & Analytics</h1>
        <p className="text-sm text-muted-foreground">
          {branchName ? `Branch: ${branchName}` : "All branches — aggregate view"}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-green-600 dark:text-green-400">
              {formatCurrency(Number(dailyRevenue._sum.amount ?? 0))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatCurrency(Number(weeklyRevenue._sum.amount ?? 0))}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatCurrency(Number(monthlyRevenue._sum.amount ?? 0))}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" role="region" aria-label="Key Performance Indicators">
        {[
          { label: "Open Job Cards", value: openJobCards },
          { label: "Completed (all time)", value: completedJobCards },
          { label: "New Job Cards (30d)", value: jobCardsCount },
          { label: "Inventory Alerts", value: inventoryAlerts, warn: inventoryAlerts > 0 },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pb-4 pt-5">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.warn ? "text-destructive" : ""}`} aria-live="polite">
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly P&L</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Revenue</p>
              <p className="text-xl font-semibold text-green-600 dark:text-green-400">
                {formatCurrency(Number(monthlyRevenue._sum.amount ?? 0))}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Expenses</p>
              <p className="text-xl font-semibold text-red-600 dark:text-red-400">
                {formatCurrency(Number(expensesTotal._sum.amount ?? 0))}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Net Profit</p>
              <p className={`text-xl font-semibold ${netProfit >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                {formatCurrency(netProfit)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {topStaff.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Technicians (this month)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topStaff.map((s: any, i: number) => (
                <div key={s.name} className="flex items-center gap-3 text-sm">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <span className="flex-1 font-medium">{s.name}</span>
                  <span className="text-muted-foreground">{s.closed} jobs closed</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <ReportDownloads branches={branches} selectedBranchId={branchId} />
    </div>
  );
}

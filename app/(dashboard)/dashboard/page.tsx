import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { getSelectedBranchId } from "@/lib/branch";
import { startOfDay, startOfMonth, subDays, format } from "date-fns";
import { Suspense } from "react";
import { DashboardCharts } from "./dashboard-charts";
import { DashboardWidgets, QuickActions } from "./dashboard-widgets";
import {
  FileText,
  CheckCircle2,
  Archive,
  Clock,
  CreditCard,
  TrendingUp,
  Calendar,
  AlertTriangle,
} from "lucide-react";

export default async function DashboardPage() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const monthStart = startOfMonth(now);
  const thirtyDaysAgo = subDays(now, 29);
  const last30Days = Array.from({ length: 30 }, (_, i) =>
    format(subDays(now, 29 - i), "yyyy-MM-dd")
  );

  const branchId = await getSelectedBranchId();
  const branchWhere = branchId ? { branchId } : {};

  // Fetch everything in parallel to avoid async waterfalls
  const [
    branchName,
    openJobCards,
    inProgressJobCards,
    completedJobCards,
    todayServicesDue,
    pendingPaymentsCount,
    dailyRevenue,
    monthlyRevenue,
    lowStockCount,
    revenueRows,
  ] = await Promise.all([
    branchId
      ? prisma.branch.findUnique({ where: { id: branchId }, select: { name: true } }).then((b: { name: string } | null) => b?.name)
      : Promise.resolve(null),
    prisma.jobCard.count({ where: { ...branchWhere, status: "OPEN" } }),
    prisma.jobCard.count({ where: { ...branchWhere, status: "IN_PROGRESS" } }),
    prisma.jobCard.count({ where: { ...branchWhere, status: "COMPLETED" } }),
    prisma.jobCard.count({
      where: {
        ...branchWhere,
        status: { in: ["OPEN", "IN_PROGRESS"] },
        serviceDueDate: {
          gte: todayStart,
          lt: new Date(todayStart.getTime() + 86400000),
        },
      },
    }),
    prisma.invoice.count({ where: { ...branchWhere, status: "PENDING" } }),
    prisma.payment.aggregate({
      where: {
        ...branchWhere,
        paidAt: {
          gte: todayStart,
          lt: new Date(todayStart.getTime() + 86400000),
        },
      },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { ...branchWhere, paidAt: { gte: monthStart } },
      _sum: { amount: true },
    }),
    branchId
      ? prisma.$queryRaw<[{ count: bigint }]>`
          SELECT COUNT(*)::bigint AS count FROM "InventoryItem"
          WHERE quantity <= "minQuantity" AND "branchId" = ${branchId}
        `.then((r: [{ count: bigint }]) => Number(r[0].count))
      : prisma.$queryRaw<[{ count: bigint }]>`
          SELECT COUNT(*)::bigint AS count FROM "InventoryItem"
          WHERE quantity <= "minQuantity"
        `.then((r: [{ count: bigint }]) => Number(r[0].count)),
    branchId
      ? prisma.$queryRaw<Array<{ day: string; revenue: number }>>`
          SELECT TO_CHAR("paidAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day,
                 COALESCE(SUM(amount), 0)::float AS revenue
          FROM "Payment"
          WHERE "paidAt" >= ${thirtyDaysAgo} AND "branchId" = ${branchId}
          GROUP BY day ORDER BY day ASC
        `
      : prisma.$queryRaw<Array<{ day: string; revenue: number }>>`
          SELECT TO_CHAR("paidAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day,
                 COALESCE(SUM(amount), 0)::float AS revenue
          FROM "Payment"
          WHERE "paidAt" >= ${thirtyDaysAgo}
          GROUP BY day ORDER BY day ASC
        `,
  ]);

  const widgets = [
    {
      title: "Open Job Cards",
      value: openJobCards,
      href: "/jobcards?status=OPEN",
      icon: FileText,
      color: "blue" as const,
      description: `${inProgressJobCards} in progress`,
    },
    {
      title: "Completed Jobs",
      value: completedJobCards,
      href: "/jobcards?status=COMPLETED",
      icon: CheckCircle2,
      color: "green" as const,
    },
    {
      title: "Pending Payments",
      value: pendingPaymentsCount,
      href: "/invoices?status=PENDING",
      icon: CreditCard,
      color: "amber" as const,
      description: "Awaiting collection",
    },
    {
      title: "Today's Services",
      value: todayServicesDue,
      href: "/jobcards",
      icon: Calendar,
      color: "purple" as const,
      description: "Due today",
    },
    {
      title: "Daily Revenue",
      value: formatCurrency(Number(dailyRevenue._sum.amount ?? 0)),
      icon: TrendingUp,
      color: "green" as const,
      description: "Collected today",
    },
    {
      title: "Monthly Revenue",
      value: formatCurrency(Number(monthlyRevenue._sum.amount ?? 0)),
      icon: Archive,
      color: "blue" as const,
      description: "This month",
    },
    {
      title: "Inventory Alerts",
      value: lowStockCount,
      href: "/inventory?lowStock=1",
      icon: AlertTriangle,
      color: lowStockCount > 0 ? ("red" as const) : ("slate" as const),
      description: "Low stock items",
    },
    {
      title: "In Progress",
      value: inProgressJobCards,
      href: "/jobcards?status=IN_PROGRESS",
      icon: Clock,
      color: "amber" as const,
      description: "Being serviced",
    },
  ];

  const revenueMap = new Map<string, number>(
    revenueRows.map((r: { day: string; revenue: number }) => [r.day, Number(r.revenue)])
  );
  const revenueByDay: Array<{ date: string; revenue: number }> = last30Days.map((d) => ({
    date: d,
    revenue: Number(revenueMap.get(d) ?? 0),
  }));

  const [serviceCounts, vehicleTypeCounts, staffCompleted] = await Promise.all([
    prisma.jobCardService
      .groupBy({
        by: ["serviceId"],
        _count: true,
        ...(branchId ? { where: { jobCard: { branchId } } } : {}),
      })
      .then(async (groups: Array<{ serviceId: string; _count: number }>) => {
        const ids = groups.map((g: { serviceId: string }) => g.serviceId);
        const services = await prisma.service.findMany({
          where: { id: { in: ids } },
          select: { id: true, name: true },
        });
        const map = new Map(services.map((s: { id: string; name: string }) => [s.id, s.name]));
        return groups.map((g: { serviceId: string; _count: number }) => ({
          name: map.get(g.serviceId) ?? "Unknown",
          count: g._count,
        }));
      }),

    prisma.vehicle
      .groupBy({
        by: ["make"],
        _count: true,
        ...(branchId
          ? { where: { jobCards: { some: { branchId } } } }
          : {}),
      })
      .then((groups: Array<{ make: string | null; _count: number }>) =>
        groups.map((g: { make: string | null; _count: number }) => ({ type: g.make ?? "Unknown", count: g._count }))
      ),

    prisma.jobCard
      .groupBy({
        by: ["technicianId"],
        where: { ...branchWhere, status: "CLOSED" },
        _count: true,
      })
      .then(async (groups: Array<{ technicianId: string | null; _count: number }>) => {
        const ids = groups
          .map((g: { technicianId: string | null }) => g.technicianId)
          .filter(Boolean) as string[];
        const staff = await prisma.staff.findMany({
          where: { id: { in: ids } },
          select: { id: true, name: true },
        });
        const map = new Map(staff.map((s: { id: string; name: string }) => [s.id, s.name]));
        return groups.map((g: { technicianId: string | null; _count: number }) => ({
          name: g.technicianId
            ? (map.get(g.technicianId) ?? "Unassigned")
            : "Unassigned",
          completed: g._count,
        }));
      }),
  ]);

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-xl font-bold md:text-2xl">Dashboard</h1>
        {branchName ? (
          <p className="text-sm text-muted-foreground">
            Showing data for{" "}
            <span className="font-medium text-foreground">{branchName}</span>
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            All branches — aggregate view
          </p>
        )}
      </div>

      {/* ── Quick Actions ── */}
      <QuickActions />

      {/* ── KPI Widgets ── */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Overview
        </h2>
        <DashboardWidgets widgets={widgets} />
      </div>

      {/* ── Charts ── */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Analytics
        </h2>
        <Suspense
          fallback={
            <div className="h-80 animate-pulse rounded-xl bg-muted" />
          }
        >
          <DashboardCharts
            revenueData={revenueByDay}
            serviceData={serviceCounts}
            vehicleTypeData={vehicleTypeCounts}
            staffData={staffCompleted}
          />
        </Suspense>
      </div>
    </div>
  );
}

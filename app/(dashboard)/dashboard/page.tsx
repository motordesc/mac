import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { getSelectedBranchId } from "@/lib/branch";
import { startOfDay, startOfMonth, subDays, format } from "date-fns";
import { getCachedDashboardData } from "./dashboard-data";
import { Suspense } from "react";
import { DashboardCharts } from "./dashboard-charts";
import { DashboardWidgets, QuickActions } from "./dashboard-widgets";
import type { WidgetData } from "./dashboard-widgets";

export default async function DashboardPage() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const monthStart = startOfMonth(now);
  const thirtyDaysAgo = subDays(now, 29);
  const last30Days = Array.from({ length: 30 }, (_, i) =>
    format(subDays(now, 29 - i), "yyyy-MM-dd")
  );

  const branchId = await getSelectedBranchId();

  // Fetch data using the cached layer (60s TTL)
  const data = await getCachedDashboardData(branchId);
  const {
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
    serviceCounts,
    vehicleTypeCounts,
    staffCompleted,
  } = data;

  // Pass plain serializable data — NO function references (icons resolved client-side)
  const widgets: WidgetData[] = [
    {
      title: "Open Job Cards",
      value: openJobCards,
      href: "/jobcards?status=OPEN",
      iconName: "FileText",
      color: "blue",
      description: `${inProgressJobCards} in progress`,
    },
    {
      title: "Completed Jobs",
      value: completedJobCards,
      href: "/jobcards?status=COMPLETED",
      iconName: "CheckCircle2",
      color: "green",
    },
    {
      title: "Pending Payments",
      value: pendingPaymentsCount,
      href: "/invoices?status=PENDING",
      iconName: "CreditCard",
      color: "amber",
      description: "Awaiting collection",
    },
    {
      title: "Today's Services",
      value: todayServicesDue,
      href: "/jobcards",
      iconName: "Calendar",
      color: "purple",
      description: "Due today",
    },
    {
      title: "Daily Revenue",
      value: formatCurrency(Number(dailyRevenue ?? 0)),
      iconName: "TrendingUp",
      color: "green",
      description: "Collected today",
    },
    {
      title: "Monthly Revenue",
      value: formatCurrency(Number(monthlyRevenue ?? 0)),
      iconName: "Archive",
      color: "blue",
      description: "This month",
    },
    {
      title: "Inventory Alerts",
      value: lowStockCount,
      href: "/inventory?lowStock=1",
      iconName: "AlertTriangle",
      color: lowStockCount > 0 ? "red" : "slate",
      description: "Low stock items",
    },
    {
      title: "In Progress",
      value: inProgressJobCards,
      href: "/jobcards?status=IN_PROGRESS",
      iconName: "Clock",
      color: "amber",
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

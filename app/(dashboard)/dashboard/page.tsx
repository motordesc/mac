import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { startOfDay, startOfMonth, subDays, format } from "date-fns";
import { Suspense } from "react";
import { DashboardCharts } from "./dashboard-charts";
import { DashboardWidgets } from "./dashboard-widgets";

export default async function DashboardPage() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const monthStart = startOfMonth(now);
  const last30Days = Array.from({ length: 30 }, (_, i) =>
    format(subDays(now, 29 - i), "yyyy-MM-dd")
  );

  const [
    openJobCards,
    completedJobCards,
    closedJobCards,
    todayServicesDue,
    pendingPaymentsCount,
    dailyRevenue,
    monthlyRevenue,
    lowStockCount,
  ] = await Promise.all([
    prisma.jobCard.count({ where: { status: "OPEN" } }),
    prisma.jobCard.count({ where: { status: "COMPLETED" } }),
    prisma.jobCard.count({ where: { status: "CLOSED" } }),
    prisma.jobCard.count({
      where: {
        status: { in: ["OPEN", "IN_PROGRESS"] },
        serviceDueDate: { gte: todayStart, lt: new Date(todayStart.getTime() + 86400000) },
      },
    }),
    prisma.invoice.count({ where: { status: "PENDING" } }),
    prisma.payment.aggregate({
      where: { paidAt: { gte: todayStart, lt: new Date(todayStart.getTime() + 86400000) } },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { paidAt: { gte: monthStart } },
      _sum: { amount: true },
    }),
    prisma.inventoryItem.findMany({ select: { id: true, quantity: true, minQuantity: true } }).then(
      (items) => items.filter((i) => i.quantity <= i.minQuantity).length
    ),
  ]);

  const widgets = [
    { title: "Open Job Cards", value: openJobCards, href: "/jobcards?status=OPEN" },
    { title: "Completed Job Cards", value: completedJobCards, href: "/jobcards?status=COMPLETED" },
    { title: "Closed Job Cards", value: closedJobCards, href: "/jobcards?status=CLOSED" },
    { title: "Today's Services Due", value: todayServicesDue, href: "/jobcards" },
    { title: "Pending Payments", value: pendingPaymentsCount, href: "/invoices?status=PENDING" },
    { title: "Daily Revenue", value: formatCurrency(Number(dailyRevenue._sum.amount ?? 0)) },
    { title: "Monthly Revenue", value: formatCurrency(Number(monthlyRevenue._sum.amount ?? 0)) },
    { title: "Inventory Alerts", value: lowStockCount, href: "/inventory?lowStock=1" },
  ];

  const [revenueByDay, serviceCounts, vehicleTypeCounts, staffCompleted] =
    await Promise.all([
      Promise.all(
        last30Days.map(async (d) => {
          const start = new Date(d + "T00:00:00");
          const end = new Date(d + "T23:59:59.999");
          const sum = await prisma.payment.aggregate({
            where: { paidAt: { gte: start, lte: end } },
            _sum: { amount: true },
          });
          return { date: d, revenue: Number(sum._sum.amount ?? 0) };
        })
      ),
      prisma.jobCardService.groupBy({
        by: ["serviceId"],
        _count: true,
      }).then(async (groups) => {
        const serviceIds = groups.map((g) => g.serviceId);
        const services = await prisma.service.findMany({
          where: { id: { in: serviceIds } },
          select: { id: true, name: true },
        });
        const map = new Map(services.map((s) => [s.id, s.name]));
        return groups.map((g) => ({
          name: map.get(g.serviceId) ?? "Unknown",
          count: g._count,
        }));
      }),
      prisma.vehicle.groupBy({
        by: ["make"],
        _count: true,
      }).then((groups) =>
        groups.map((g) => ({ type: g.make ?? "Unknown", count: g._count }))
      ),
      prisma.jobCard.groupBy({
        by: ["technicianId"],
        where: { status: "CLOSED" },
        _count: true,
      }).then(async (groups) => {
        const staffIds = groups.map((g) => g.technicianId).filter(Boolean) as string[];
        const staff = await prisma.staff.findMany({
          where: { id: { in: staffIds } },
          select: { id: true, name: true },
        });
        const map = new Map(staff.map((s) => [s.id, s.name]));
        return groups.map((g) => ({
          name: g.technicianId ? map.get(g.technicianId) ?? "Unassigned" : "Unassigned",
          completed: g._count,
        }));
      }),
    ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <DashboardWidgets widgets={widgets} />
      <Suspense fallback={<div className="h-80 animate-pulse rounded-lg bg-muted" />}>
        <DashboardCharts
          revenueData={revenueByDay}
          serviceData={serviceCounts}
          vehicleTypeData={vehicleTypeCounts}
          staffData={staffCompleted}
        />
      </Suspense>
    </div>
  );
}

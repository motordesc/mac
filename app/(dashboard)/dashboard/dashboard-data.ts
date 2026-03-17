import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { startOfDay, startOfMonth, subDays, format } from "date-fns";
import { Prisma } from "@prisma/client";

export const getCachedDashboardData = unstable_cache(
  async (branchId: string | null) => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const monthStart = startOfMonth(now);
    const thirtyDaysAgo = subDays(now, 29);
    
    const branchWhere = branchId ? { branchId } : {};

    const [
      branchSummary,
      openJobCards,
      inProgressJobCards,
      completedJobCards,
      todayServicesDue,
      pendingPaymentsCount,
      dailyRevenueAggregation,
      monthlyRevenueAggregation,
      lowStockResult,
      revenueRowsResult,
      serviceCounts,
      vehicleTypeCounts,
      staffCompleted,
    ] = await Promise.all([
      branchId
        ? prisma.branch.findUnique({ where: { id: branchId }, select: { name: true } })
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
          `
        : prisma.$queryRaw<[{ count: bigint }]>`
            SELECT COUNT(*)::bigint AS count FROM "InventoryItem"
            WHERE quantity <= "minQuantity"
          `,
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
      prisma.jobCardService
        .groupBy({
          by: ["serviceId"],
          _count: true,
          ...(branchId ? { where: { jobCard: { branchId } } } : {}),
        })
        .then(async (groups) => {
          const ids = groups.map((g) => g.serviceId);
          const services = await prisma.service.findMany({
            where: { id: { in: ids } },
            select: { id: true, name: true },
          });
          const map = new Map(services.map((s) => [s.id, s.name]));
          return groups.map((g) => ({
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
        .then((groups) =>
          groups.map((g) => ({ type: g.make ?? "Unknown", count: g._count }))
        ),
      prisma.jobCard
        .groupBy({
          by: ["technicianId"],
          where: { ...branchWhere, status: "CLOSED" },
          _count: true,
        })
        .then(async (groups) => {
          const ids = groups
            .map((g) => g.technicianId)
            .filter(Boolean) as string[];
          const staff = await prisma.staff.findMany({
            where: { id: { in: ids } },
            select: { id: true, name: true },
          });
          const map = new Map(staff.map((s) => [s.id, s.name]));
          return groups.map((g) => ({
            name: g.technicianId
              ? (map.get(g.technicianId) ?? "Unassigned")
              : "Unassigned",
            completed: g._count,
          }));
        }),
    ]);

    return {
      branchName: branchSummary?.name || null,
      openJobCards,
      inProgressJobCards,
      completedJobCards,
      todayServicesDue,
      pendingPaymentsCount,
      dailyRevenue: dailyRevenueAggregation._sum.amount || 0,
      monthlyRevenue: monthlyRevenueAggregation._sum.amount || 0,
      lowStockCount: Number(lowStockResult[0].count),
      revenueRows: revenueRowsResult,
      serviceCounts,
      vehicleTypeCounts,
      staffCompleted,
    };
  },
  ["dashboard-metrics"],
  { tags: ["dashboard"], revalidate: 60 } // Cache structure for 60 seconds
);

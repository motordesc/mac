import { prisma } from "@/lib/prisma";
import { tool } from "ai";
import { z } from "zod";

export const getRevenueStats = tool({
  description: "Get revenue statistics. Optionally filter by branch.",
  parameters: z.object({
    period: z.enum(["today", "week", "month"]).optional().default("month"),
    branchId: z.string().optional(),
  }),
  execute: async ({ period, branchId }) => {
    const now = new Date();
    const start = period === "today" ? new Date(now.getFullYear(), now.getMonth(), now.getDate())
      : period === "week" ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      : new Date(now.getFullYear(), now.getMonth(), 1);
    const bw = branchId ? { branchId } : {};
    const [rev, exp] = await Promise.all([
      prisma.payment.aggregate({ where: { ...bw, paidAt: { gte: start } }, _sum: { amount: true }, _count: true }),
      prisma.expense.aggregate({ where: { ...bw, date: { gte: start } }, _sum: { amount: true } }),
    ]);
    const revenue = Number(rev._sum.amount ?? 0);
    const expenses = Number(exp._sum.amount ?? 0);
    return { period, totalRevenue: revenue, totalExpenses: expenses, netProfit: revenue - expenses, transactionCount: rev._count };
  },
});

export const getInventoryLevels = tool({
  description: "Get inventory stock levels. Optionally filter by branch.",
  parameters: z.object({ branchId: z.string().optional() }),
  execute: async ({ branchId }) => {
    const items = await prisma.inventoryItem.findMany({
      where: branchId ? { branchId } : {},
      select: { name: true, sku: true, quantity: true, minQuantity: true, branch: { select: { name: true } } },
    });
    const lowStock = items.filter((i: { quantity: number; minQuantity: number }) => i.quantity <= i.minQuantity);
    return { totalItems: items.length, lowStockCount: lowStock.length, lowStockItems: lowStock.slice(0, 10) };
  },
});

export const getVehicleHistory = tool({
  description: "Get service history for a vehicle by number plate.",
  parameters: z.object({ numberPlate: z.string() }),
  execute: async ({ numberPlate }) => {
    const vehicle = await prisma.vehicle.findFirst({
      where: { numberPlate: { contains: numberPlate, mode: "insensitive" } },
      include: {
        customer: { select: { name: true, phone: true } },
        jobCards: { take: 20, orderBy: { createdAt: "desc" }, include: { technician: true, branch: { select: { name: true } } } },
      },
    });
    if (!vehicle) return { found: false };
    return {
      found: true,
      vehicle: { numberPlate: vehicle.numberPlate, make: vehicle.make, model: vehicle.model },
      customer: vehicle.customer,
      jobCards: vehicle.jobCards.map((jc: { id: string; status: any; branch: { name: string } | null; technician: { name: string } | null; createdAt: Date }) => ({ id: jc.id, status: jc.status, branch: jc.branch?.name, technician: jc.technician?.name, createdAt: jc.createdAt })),
    };
  },
});

export const getCustomerData = tool({
  description: "Look up customers by name or phone.",
  parameters: z.object({ phone: z.string().optional(), name: z.string().optional() }),
  execute: async ({ phone, name }) => {
    if (!phone && !name) {
      throw new Error("At least one of phone or name must be provided");
    }
    const where: Record<string, unknown> = {};
    if (phone) where.phone = { contains: phone, mode: "insensitive" };
    if (name) where.name = { contains: name, mode: "insensitive" };
    const customers = await prisma.customer.findMany({
      where: Object.keys(where).length ? where : undefined,
      take: 10,
      include: { _count: { select: { vehicles: true, jobCards: true } } },
    });
    return { count: customers.length, customers };
  },
});

export const getJobCardSummary = tool({
  description: "Get job card counts and recent cards. Optionally filter by branch or status.",
  parameters: z.object({
    status: z.enum(["OPEN", "IN_PROGRESS", "COMPLETED", "CLOSED"]).optional(),
    branchId: z.string().optional(),
    limit: z.number().min(1).max(50).optional().default(10),
  }),
  execute: async ({ status, branchId, limit }) => {
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (branchId) where.branchId = branchId;
    const [items, counts] = await Promise.all([
      prisma.jobCard.findMany({
        where, take: limit, orderBy: { createdAt: "desc" },
        include: { vehicle: { select: { numberPlate: true } }, customer: { select: { name: true } }, technician: { select: { name: true } }, branch: { select: { name: true } } },
      }),
      prisma.jobCard.groupBy({ by: ["status"], where: branchId ? { branchId } : {}, _count: true }),
    ]);
    return {
      statusCounts: counts.reduce((acc: Record<string, number>, c: { status: string; _count: number }) => ({ ...acc, [c.status]: c._count }), {}),
      recentJobCards: items.map((jc: { id: string; status: any; vehicle: { numberPlate: string }; customer: { name: string }; technician: { name: string } | null; branch: { name: string } | null }) => ({ id: jc.id, status: jc.status, vehicle: jc.vehicle.numberPlate, customer: jc.customer.name, technician: jc.technician?.name, branch: jc.branch?.name })),
    };
  },
});

export const getBranchOverview = tool({
  description: "Compare all branches — revenue, job cards, staff count. Use for branch comparison questions.",
  parameters: z.object({}),
  execute: async () => {
    const branches = await prisma.branch.findMany({ where: { isActive: true }, include: { _count: { select: { jobCards: true, staff: true, invoices: true } } } });
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const revenues = await Promise.all(branches.map(async (b: { id: string }) => {
      const agg = await prisma.payment.aggregate({ where: { branchId: b.id, paidAt: { gte: monthStart } }, _sum: { amount: true } });
      return { id: b.id, revenue: Number(agg._sum.amount ?? 0) };
    }));
    const rMap = new Map(revenues.map((r: { id: string; revenue: number }) => [r.id, r.revenue]));
    return {
      totalBranches: branches.length,
      branches: branches.map((b: { name: string; address: string | null; _count: { jobCards: number; staff: number; invoices: number }; id: string }) => ({ name: b.name, address: b.address, jobCards: b._count.jobCards, staff: b._count.staff, invoices: b._count.invoices, monthlyRevenue: rMap.get(b.id) ?? 0 })),
    };
  },
});

export const getBusinessInsights = tool({
  description: "Get a business health summary to help grow the business. Covers open jobs, completions, unpaid invoices, low stock, and top services.",
  parameters: z.object({ branchId: z.string().optional() }),
  execute: async ({ branchId }) => {
    const now = new Date();
    const bw = branchId ? { branchId } : {};
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const [open, completedThisMonth, pending, topServices] = await Promise.all([
      prisma.jobCard.count({ where: { ...bw, status: "OPEN" } }),
      prisma.jobCard.count({ where: { ...bw, status: { in: ["COMPLETED", "CLOSED"] }, updatedAt: { gte: monthStart } } }),
      prisma.invoice.count({ where: { ...bw, status: "PENDING" } }),
      prisma.jobCardService.groupBy({ by: ["serviceId"], _count: true, orderBy: { _count: { serviceId: "desc" } }, take: 5, ...(branchId ? { where: { jobCard: { branchId } } } : {}) })
        .then(async (groups: Array<{ serviceId: string; _count: number }>) => {
          const ids = groups.map((g: { serviceId: string }) => g.serviceId);
          const svcs = await prisma.service.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } });
          const map = new Map(svcs.map((s: { id: string; name: string }) => [s.id, s.name]));
          return groups.map((g: { serviceId: string; _count: number }) => ({ name: map.get(g.serviceId) ?? "Unknown", count: g._count }));
        }),
    ]);
    return {
      openJobCards: open,
      completedThisMonth,
      pendingInvoices: pending,
      topServices,
      summary: `${open} open jobs, ${completedThisMonth} completed this month, ${pending} unpaid invoices. Top service: ${topServices[0]?.name ?? "N/A"}.`,
    };
  },
});

export const aiTools = {
  getRevenueStats,
  getInventoryLevels,
  getVehicleHistory,
  getCustomerData,
  getJobCardSummary,
  getBranchOverview,
  getBusinessInsights,
};

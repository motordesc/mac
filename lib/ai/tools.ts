import { prisma } from "@/lib/prisma";
import { tool } from "ai";
import { z } from "zod";

export const getRevenueStats = tool({
  description: "Get revenue statistics (daily, monthly, or for a date range).",
  parameters: z.object({
    period: z.enum(["today", "month", "week"]).optional().default("month"),
  }),
  execute: async ({ period }) => {
    const now = new Date();
    const start =
      period === "today"
        ? new Date(now.getFullYear(), now.getMonth(), now.getDate())
        : period === "week"
          ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          : new Date(now.getFullYear(), now.getMonth(), 1);
    const agg = await prisma.payment.aggregate({
      where: { paidAt: { gte: start } },
      _sum: { amount: true },
      _count: true,
    });
    return {
      period,
      totalRevenue: Number(agg._sum.amount ?? 0),
      transactionCount: agg._count,
    };
  },
});

export const getInventoryLevels = tool({
  description: "Get inventory item levels and low-stock items.",
  parameters: z.object({}),
  execute: async () => {
    const items = await prisma.inventoryItem.findMany({
      select: { name: true, sku: true, quantity: true, minQuantity: true },
    });
    const lowStock = items.filter((i) => i.quantity <= i.minQuantity);
    return { items: items.slice(0, 30), lowStockCount: lowStock.length, lowStock: lowStock.slice(0, 10) };
  },
});

export const getVehicleHistory = tool({
  description: "Get service history for a vehicle by number plate.",
  parameters: z.object({
    numberPlate: z.string().describe("Vehicle number plate"),
  }),
  execute: async ({ numberPlate }) => {
    const vehicle = await prisma.vehicle.findFirst({
      where: { numberPlate: { contains: numberPlate, mode: "insensitive" } },
      include: {
        jobCards: { take: 20, orderBy: { createdAt: "desc" }, include: { technician: true } },
      },
    });
    if (!vehicle) return { found: false };
    return {
      found: true,
      vehicle: { numberPlate: vehicle.numberPlate, make: vehicle.make, model: vehicle.model },
      jobCards: vehicle.jobCards.map((jc) => ({
        id: jc.id,
        status: jc.status,
        createdAt: jc.createdAt,
        technician: jc.technician?.name,
      })),
    };
  },
});

export const getCustomerData = tool({
  description: "Get customer details and their vehicles/job cards.",
  parameters: z.object({
    phone: z.string().optional(),
    name: z.string().optional(),
  }),
  execute: async ({ phone, name }) => {
    const where: { phone?: { contains: string; mode: "insensitive" }; name?: { contains: string; mode: "insensitive" } } = {};
    if (phone) where.phone = { contains: phone, mode: "insensitive" };
    if (name) where.name = { contains: name, mode: "insensitive" };
    const customers = await prisma.customer.findMany({
      where: Object.keys(where).length ? where : undefined,
      take: 10,
      include: { _count: { select: { vehicles: true, jobCards: true } } },
    });
    return { customers };
  },
});

export const getJobCards = tool({
  description: "Get job cards with optional status filter.",
  parameters: z.object({
    status: z.enum(["OPEN", "IN_PROGRESS", "COMPLETED", "CLOSED"]).optional(),
    limit: z.number().min(1).max(50).optional().default(10),
  }),
  execute: async ({ status, limit }) => {
    const items = await prisma.jobCard.findMany({
      where: status ? { status } : undefined,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        vehicle: { select: { numberPlate: true } },
        customer: { select: { name: true } },
        technician: { select: { name: true } },
      },
    });
    return {
      count: items.length,
      jobCards: items.map((jc) => ({
        id: jc.id,
        status: jc.status,
        vehicle: jc.vehicle.numberPlate,
        customer: jc.customer.name,
        technician: jc.technician?.name,
        createdAt: jc.createdAt,
      })),
    };
  },
});

export const aiTools = {
  getRevenueStats,
  getInventoryLevels,
  getVehicleHistory,
  getCustomerData,
  getJobCards,
};
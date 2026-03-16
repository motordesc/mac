import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const type = request.nextUrl.searchParams.get("type") ?? "financial";
  const branchId = request.nextUrl.searchParams.get("branchId") ?? undefined;
  const branchWhere = branchId ? { branchId } : {};

  let branchLabel = "all-branches";
  if (branchId) {
    const b = await prisma.branch.findUnique({ where: { id: branchId }, select: { name: true } });
    branchLabel = b?.name?.toLowerCase().replace(/\s+/g, "-") ?? "branch";
  }

  const wb = XLSX.utils.book_new();

  async function buildFinancialSheet() {
    const [payments, expenses] = await Promise.all([
      prisma.payment.findMany({ where: branchWhere, orderBy: { paidAt: "desc" }, take: 2000, include: { invoice: { select: { invoiceNumber: true } } } }),
      prisma.expense.findMany({ where: branchWhere, orderBy: { date: "desc" }, take: 2000 }),
    ]);
    const rows = [
      ...payments.map((p: any) => ({ Date: p.paidAt.toISOString().slice(0,10), Type: "INCOME", Reference: p.invoice?.invoiceNumber ?? "", Method: p.method, Amount: Number(p.amount) })),
      ...expenses.map((e: any) => ({ Date: e.date.toISOString().slice(0,10), Type: "EXPENSE", Reference: e.description ?? "", Method: e.category, Amount: -Number(e.amount) })),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Financial");
  }

  async function buildInventorySheet() {
    const items = await prisma.inventoryItem.findMany({ where: branchWhere, orderBy: { name: "asc" }, include: { supplier: { select: { name: true } } } });
    const rows = items.map((i: any) => ({ Name: i.name, SKU: i.sku ?? "", Supplier: i.supplier?.name ?? "", Qty: i.quantity, "Min Qty": i.minQuantity, "Low Stock": i.quantity <= i.minQuantity ? "YES" : "no", "Purchase Price": Number(i.purchasePrice), "Selling Price": Number(i.sellingPrice) }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Inventory");
  }

  async function buildStaffSheet() {
    const staff = await prisma.staff.findMany({ where: branchWhere, orderBy: { name: "asc" }, include: { _count: { select: { jobCards: true } }, branch: { select: { name: true } } } });
    const rows = staff.map((s: any) => ({ Name: s.name, Role: s.role, Phone: s.phone ?? "", Branch: s.branch?.name ?? "", "Job Cards": s._count.jobCards }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Staff");
  }

  async function buildJobCardsSheet() {
    const cards = await prisma.jobCard.findMany({ where: branchWhere, orderBy: { createdAt: "desc" }, take: 2000, include: { vehicle: { select: { numberPlate: true, make: true, model: true } }, customer: { select: { name: true, phone: true } }, technician: { select: { name: true } }, branch: { select: { name: true } } } });
    const rows = cards.map((j: any) => ({ Created: j.createdAt.toISOString().slice(0,10), Branch: j.branch?.name ?? "", "Vehicle No": j.vehicle.numberPlate, Customer: j.customer.name, Phone: j.customer.phone, Technician: j.technician?.name ?? "", Status: j.status, "Est. Cost": j.estimatedCost ? Number(j.estimatedCost) : "" }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Job Cards");
  }

  async function buildCustomersSheet() {
    const customers = await prisma.customer.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { vehicles: true, jobCards: true } } } });
    const rows = customers.map((c: any) => ({ Name: c.name, Phone: c.phone, Address: c.address ?? "", Vehicles: c._count.vehicles, "Job Cards": c._count.jobCards }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Customers");
  }

  switch (type) {
    case "financial":  await buildFinancialSheet();  break;
    case "inventory":  await buildInventorySheet();  break;
    case "staff":      await buildStaffSheet();      break;
    case "jobcards":   await buildJobCardsSheet();   break;
    case "customers":  await buildCustomersSheet();  break;
    case "full":
      await buildFinancialSheet(); await buildInventorySheet();
      await buildStaffSheet(); await buildJobCardsSheet(); await buildCustomersSheet();
      break;
    default: return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
  }

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const filename = `mac-${type}-${branchLabel}-${new Date().toISOString().slice(0,10)}.xlsx`;
  return new NextResponse(buf, { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="${filename}"` } });
}

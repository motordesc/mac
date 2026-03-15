import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type") ?? "expenses";
  let data: unknown[] = [];
  let filename = "export.xlsx";

  switch (type) {
    case "expenses": {
      const rows = await prisma.expense.findMany({
        orderBy: { date: "desc" },
        take: 1000,
      });
      data = rows.map((e) => ({
        Date: e.date.toISOString().slice(0, 10),
        Category: e.category,
        Amount: Number(e.amount),
        Description: e.description,
      }));
      filename = "expenses.xlsx";
      break;
    }
    case "inventory": {
      const rows = await prisma.inventoryItem.findMany({
        orderBy: { name: "asc" },
        include: { supplier: { select: { name: true } } },
      });
      data = rows.map((i) => ({
        Name: i.name,
        SKU: i.sku,
        Quantity: i.quantity,
        "Min Qty": i.minQuantity,
        "Purchase Price": Number(i.purchasePrice),
        "Selling Price": Number(i.sellingPrice),
        Supplier: i.supplier?.name,
      }));
      filename = "inventory.xlsx";
      break;
    }
    case "customers": {
      const rows = await prisma.customer.findMany({
        orderBy: { name: "asc" },
      });
      data = rows.map((c) => ({
        Name: c.name,
        Phone: c.phone,
        Address: c.address,
      }));
      filename = "customers.xlsx";
      break;
    }
    case "jobcards": {
      const rows = await prisma.jobCard.findMany({
        take: 500,
        orderBy: { createdAt: "desc" },
        include: {
          vehicle: true,
          customer: true,
          technician: true,
        },
      });
      data = rows.map((j) => ({
        ID: j.id,
        "Vehicle No": j.vehicle.numberPlate,
        Customer: j.customer.name,
        Technician: j.technician?.name,
        Status: j.status,
        "Est. Cost": j.estimatedCost ? Number(j.estimatedCost) : null,
        Created: j.createdAt.toISOString(),
      }));
      filename = "jobcards.xlsx";
      break;
    }
    default:
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

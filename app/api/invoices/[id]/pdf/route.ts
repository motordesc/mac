import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { renderToStream } from "@react-pdf/renderer";
import { InvoicePdfDocument } from "@/lib/pdf/invoice-pdf";
import { validateId } from "@/lib/utils/validate-id";
import React from "react";
import { Readable } from "stream";

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream)
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: rawId } = await params;
  let id: string;
  try {
    id = validateId(rawId);
  } catch {
    return NextResponse.json({ error: "Invalid invoice ID" }, { status: 400 });
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: true,
      branch: true,
      jobCard: { include: { vehicle: true } },
      items: true,
    },
  });
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  const settings = await prisma.garageSettings.findMany();
  const taxRate = settings.find((s) => s.key === "tax_rate")?.value;

  const data = {
    companyName: "Motor Auto Care",
    branchName: invoice.branch?.name,
    branchAddress: invoice.branch?.address ?? undefined,
    branchPhone: invoice.branch?.phone ?? undefined,
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: invoice.createdAt.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    customerName: invoice.customer.name,
    customerPhone: invoice.customer.phone,
    customerAddress: invoice.customer.address ?? undefined,
    vehicleNumber: invoice.jobCard?.vehicle?.numberPlate,
    items: invoice.items.map((i) => ({
      description: i.description,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
    })),
    subtotal: invoice.subtotal,
    tax: invoice.tax,
    total: invoice.total,
    status: invoice.status,
    taxRate,
  };

  const stream = await renderToStream(React.createElement(InvoicePdfDocument, { data }));
  const buffer = await streamToBuffer(stream as Readable);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
    },
  });
}

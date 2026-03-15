import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { renderToStream } from "@react-pdf/renderer";
import { InvoicePdfDocument } from "@/lib/pdf/invoice-pdf";
import React from "react";
import { Readable } from "stream";

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: true,
      jobCard: { include: { vehicle: true } },
      items: true,
    },
  });
  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const settings = await prisma.garageSettings.findMany();
  const garageName = settings.find((s) => s.key === "garage_name")?.value ?? "Motor Auto Care";

  const data = {
    garageName,
    invoiceNumber: invoice.invoiceNumber,
    customerName: invoice.customer.name,
    customerPhone: invoice.customer.phone,
    vehicleNumber: invoice.jobCard?.vehicle?.numberPlate,
    items: invoice.items.map((i) => ({
      description: i.description,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
    })),
    subtotal: invoice.subtotal,
    tax: invoice.tax,
    total: invoice.total,
  };

  const stream = await renderToStream(
    React.createElement(InvoicePdfDocument, { data })
  );
  const buffer = await streamToBuffer(stream as Readable);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
    },
  });
}

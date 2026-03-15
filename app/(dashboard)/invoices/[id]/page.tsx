import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { InvoiceActions } from "./invoice-actions";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: true,
      jobCard: { include: { vehicle: true } },
      items: true,
      payments: true,
    },
  });
  if (!invoice) notFound();

  const settings = await prisma.garageSettings.findMany();
  const garageName = settings.find((s) => s.key === "garage_name")?.value ?? "Motor Auto Care";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/invoices"><ArrowLeft className="size-5" /></Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">{invoice.invoiceNumber}</h1>
          <p className="text-muted-foreground">{invoice.customer.name}</p>
        </div>
        <InvoiceActions invoiceId={invoice.id} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{garageName}</CardTitle>
          <p className="text-sm text-muted-foreground">
            Invoice #{invoice.invoiceNumber} · {invoice.customer.name}
            {invoice.jobCard?.vehicle && ` · ${invoice.jobCard.vehicle.numberPlate}`}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Description</th>
                <th className="text-right py-2">Qty</th>
                <th className="text-right py-2">Rate</th>
                <th className="text-right py-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="py-2">{item.description}</td>
                  <td className="text-right py-2">{item.quantity}</td>
                  <td className="text-right py-2">{formatCurrency(item.unitPrice)}</td>
                  <td className="text-right py-2">{formatCurrency(Number(item.unitPrice) * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-end gap-4 text-sm">
            <span>Subtotal: {formatCurrency(invoice.subtotal)}</span>
            <span>Tax: {formatCurrency(invoice.tax)}</span>
            <span className="font-semibold">Total: {formatCurrency(invoice.total)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

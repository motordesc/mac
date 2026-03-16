import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { InvoiceActions } from "./invoice-actions";
import { validateId } from "@/lib/utils/validate-id";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { id: rawId } = await params;
  let id: string;
  try { id = validateId(rawId); }
  catch { notFound(); }

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: true,
      branch: true,
      jobCard: { include: { vehicle: true } },
      items: true,
      payments: true,
    },
  });
  if (!invoice) notFound();

  const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    PAID: "default",
    PENDING: "secondary",
    OVERDUE: "destructive",
    CANCELLED: "destructive",
  };

  return (
    <div className="space-y-6">
      {/* ── Back + title ── */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/invoices">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">{invoice.invoiceNumber}</h1>
          <p className="text-sm text-muted-foreground">
            {invoice.customer.name}
            {invoice.branch && (
              <span className="ml-2 text-muted-foreground">· {invoice.branch.name}</span>
            )}
          </p>
        </div>
        <Badge variant={statusVariant[invoice.status] ?? "secondary"}>
          {invoice.status}
        </Badge>
        {/* Download PDF + Delete buttons */}
        <InvoiceActions invoiceId={invoice.id} invoiceNumber={invoice.invoiceNumber} />
      </div>

      {/* ── Header card ── */}
      <Card>
        <CardHeader className="space-y-1 pb-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-lg font-bold text-primary">Motor Auto Care</p>
              {invoice.branch && (
                <>
                  <p className="font-semibold">{invoice.branch.name}</p>
                  {invoice.branch.address && (
                    <p className="text-sm text-muted-foreground">{invoice.branch.address}</p>
                  )}
                  {invoice.branch.phone && (
                    <p className="text-sm text-muted-foreground">{invoice.branch.phone}</p>
                  )}
                </>
              )}
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <p>Invoice #{invoice.invoiceNumber}</p>
              <p>{invoice.createdAt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Bill-to + Vehicle */}
          <div className="grid gap-4 sm:grid-cols-2 rounded-lg bg-muted/40 p-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">Billed To</p>
              <p className="font-semibold">{invoice.customer.name}</p>
              <p className="text-sm text-muted-foreground">{invoice.customer.phone}</p>
              {invoice.customer.address && (
                <p className="text-sm text-muted-foreground">{invoice.customer.address}</p>
              )}
            </div>
            {invoice.jobCard?.vehicle && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">Vehicle</p>
                <p className="font-semibold">{invoice.jobCard.vehicle.numberPlate}</p>
                <Link href={`/jobcards/${invoice.jobCard.id}`} className="text-sm text-primary hover:underline">
                  View Job Card →
                </Link>
              </div>
            )}
          </div>

          {/* Items table */}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-border">
                <th className="py-2 text-left font-semibold">Description</th>
                <th className="py-2 text-right font-semibold">Qty</th>
                <th className="py-2 text-right font-semibold">Rate</th>
                <th className="py-2 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, i) => (
                <tr key={item.id} className={`border-b border-border ${i % 2 === 1 ? "bg-muted/30" : ""}`}>
                  <td className="py-2.5">{item.description}</td>
                  <td className="py-2.5 text-right">{item.quantity}</td>
                  <td className="py-2.5 text-right">{formatCurrency(item.unitPrice)}</td>
                  <td className="py-2.5 text-right font-medium">
                    {formatCurrency(Number(item.unitPrice) * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-60 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatCurrency(invoice.tax)}</span>
              </div>
              <div className="flex justify-between rounded-lg bg-primary px-3 py-2 font-semibold text-primary-foreground">
                <span>Total</span>
                <span>{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Payments ── */}
      {invoice.payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {invoice.payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {p.paidAt.toLocaleDateString("en-IN")} · {p.method}
                </span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  +{formatCurrency(p.amount)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

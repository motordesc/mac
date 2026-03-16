import Link from "next/link";
import { notFound } from "next/navigation";
import { getJobCardById } from "@/app/actions/jobcards";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import {
  ArrowLeft,
  Car,
  User,
  Wrench,
  FileText,
  Clock,
  CheckCircle2,
  Archive,
  CreditCard,
  CircleDollarSign,
  StickyNote,
  Package,
  ChevronRight,
} from "lucide-react";

const statusConfig: Record<
  string,
  { label: string; icon: React.ElementType; bg: string; text: string }
> = {
  OPEN:        { label: "Open",        icon: FileText,     bg: "bg-blue-100 dark:bg-blue-900/30",  text: "text-blue-700 dark:text-blue-400" },
  IN_PROGRESS: { label: "In Progress", icon: Clock,        bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400" },
  COMPLETED:   { label: "Completed",   icon: CheckCircle2, bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400" },
  CLOSED:      { label: "Closed",      icon: Archive,      bg: "bg-slate-100 dark:bg-slate-800",    text: "text-slate-600 dark:text-slate-400" },
};

const paymentConfig: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  PENDING:   { label: "Unpaid / Pending", bg: "bg-red-100 dark:bg-red-900/30",    text: "text-red-700 dark:text-red-400" },
  PAID:      { label: "Paid",             bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400" },
  OVERDUE:   { label: "Overdue",          bg: "bg-red-100 dark:bg-red-900/30",    text: "text-red-700 dark:text-red-400" },
  CANCELLED: { label: "Cancelled",        bg: "bg-slate-100 dark:bg-slate-800",    text: "text-slate-600 dark:text-slate-400" },
};

export default async function JobCardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const jc = await getJobCardById(id);
  if (!jc) notFound();

  const scfg   = statusConfig[jc.status] ?? statusConfig.OPEN;
  const StatusIcon = scfg.icon;

  const payStatus = jc.invoice?.status;
  const pcfg   = payStatus ? paymentConfig[payStatus] : null;

  const totalPaid = jc.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const invoiceTotal = jc.invoice ? Number(jc.invoice.total) : null;
  const balance = invoiceTotal != null ? invoiceTotal - totalPaid : null;

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" className="mt-0.5 shrink-0" asChild>
          <Link href="/jobcards">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold">{jc.vehicle.numberPlate}</h1>
            {/* Job status badge */}
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${scfg.bg} ${scfg.text}`}>
              <StatusIcon className="size-3.5" />
              {scfg.label}
            </span>
            {/* Payment status badge */}
            {pcfg ? (
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${pcfg.bg} ${pcfg.text}`}>
                <CreditCard className="size-3.5" />
                {pcfg.label}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                <CreditCard className="size-3.5" />
                No Invoice
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {jc.customer.name} · {formatDate(jc.createdAt)}
          </p>
        </div>
      </div>

      {/* ── Payment summary banner ── */}
      {jc.invoice && (
        <div className={`flex items-center justify-between rounded-xl p-4 ${
          payStatus === "PAID"
            ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
            : "bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800"
        }`}>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Payment Status</p>
            <p className={`text-base font-bold ${
              payStatus === "PAID"
                ? "text-green-700 dark:text-green-400"
                : "text-orange-700 dark:text-orange-400"
            }`}>
              {pcfg?.label ?? payStatus}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-lg font-bold text-foreground">{formatCurrency(jc.invoice.total)}</p>
            {totalPaid > 0 && totalPaid < Number(jc.invoice.total) && (
              <p className="text-xs text-muted-foreground">
                Paid: {formatCurrency(totalPaid)} · Due: {formatCurrency(balance ?? 0)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Details grid ── */}
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Vehicle & Customer */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Car className="size-4 text-muted-foreground" />
              Vehicle & Customer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <Car className="size-4 mt-0.5 shrink-0 text-muted-foreground" />
              <div>
                <p className="font-medium">{jc.vehicle.numberPlate}</p>
                {jc.vehicle.make && (
                  <p className="text-muted-foreground">
                    {jc.vehicle.make} {jc.vehicle.model ?? ""} {jc.vehicle.year ?? ""}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <User className="size-4 mt-0.5 shrink-0 text-muted-foreground" />
              <div>
                <p className="font-medium">{jc.customer.name}</p>
                <p className="text-muted-foreground">{jc.customer.phone}</p>
              </div>
            </div>
            {jc.technician && (
              <div className="flex items-center gap-2">
                <Wrench className="size-4 shrink-0 text-muted-foreground" />
                <p>{jc.technician.name}</p>
              </div>
            )}
            {jc.serviceDueDate && (
              <div className="flex items-center gap-2">
                <Clock className="size-4 shrink-0 text-muted-foreground" />
                <p>Due: {formatDate(jc.serviceDueDate)}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financial summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CircleDollarSign className="size-4 text-muted-foreground" />
              Financials
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {jc.estimatedCost != null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estimated</span>
                <span className="font-medium">{formatCurrency(jc.estimatedCost)}</span>
              </div>
            )}
            {jc.invoice && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invoice Total</span>
                  <span className="font-medium">{formatCurrency(jc.invoice.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount Paid</span>
                  <span className={`font-medium ${totalPaid > 0 ? "text-green-600 dark:text-green-400" : ""}`}>
                    {formatCurrency(totalPaid)}
                  </span>
                </div>
                {balance != null && balance > 0 && (
                  <div className="flex justify-between border-t border-border pt-2">
                    <span className="font-medium">Balance Due</span>
                    <span className="font-bold text-orange-600 dark:text-orange-400">
                      {formatCurrency(balance)}
                    </span>
                  </div>
                )}
              </>
            )}
            {!jc.invoice && (
              <p className="text-muted-foreground italic text-xs">No invoice created yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Services & Parts ── */}
      {(jc.services.length > 0 || jc.parts.length > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Package className="size-4 text-muted-foreground" />
              Services & Parts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {jc.services.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between py-1 border-b border-border last:border-0">
                <div>
                  <p className="font-medium">{s.service.name}</p>
                  <p className="text-xs text-muted-foreground">Qty: {s.quantity}</p>
                </div>
                <p className="font-medium">{formatCurrency(Number(s.unitPrice) * s.quantity)}</p>
              </div>
            ))}
            {jc.parts.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between py-1 border-b border-border last:border-0">
                <div>
                  <p className="font-medium">{p.inventoryItem.name}</p>
                  <p className="text-xs text-muted-foreground">Qty: {p.quantity}</p>
                </div>
                <p className="font-medium">{formatCurrency(Number(p.unitPrice) * p.quantity)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── Payments history ── */}
      {jc.payments.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CreditCard className="size-4 text-muted-foreground" />
              Payment History
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {jc.payments.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between py-1 border-b border-border last:border-0">
                <div>
                  <p className="font-medium">{p.method}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(p.paidAt)}</p>
                </div>
                <p className="font-semibold text-green-600 dark:text-green-400">
                  +{formatCurrency(p.amount)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── Notes ── */}
      {jc.notes && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <StickyNote className="size-4 text-muted-foreground" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{jc.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* ── Actions ── */}
      <div className="flex flex-wrap gap-2 pt-1">
        {jc.invoice ? (
          <Button asChild>
            <Link href={`/invoices/${jc.invoice.id}`}>
              <FileText className="mr-1.5 size-4" />
              View Invoice
              <ChevronRight className="ml-1 size-4" />
            </Link>
          </Button>
        ) : (
          <Button variant="outline" asChild>
            <Link href={`/invoices?jobCardId=${jc.id}`}>
              <CircleDollarSign className="mr-1.5 size-4" />
              Create Invoice
            </Link>
          </Button>
        )}
        <Button variant="outline" asChild>
          <Link href={`/vehicles/${jc.vehicle.id}`}>
            <Car className="mr-1.5 size-4" />
            View Vehicle
          </Link>
        </Button>
      </div>
    </div>
  );
}

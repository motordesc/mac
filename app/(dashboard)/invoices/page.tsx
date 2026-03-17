import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Receipt,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  ChevronRight,
  User,
} from "lucide-react";

type SearchParams = { page?: string; status?: string };

const statusConfig: Record<
  string,
  { label: string; icon: React.ElementType; badgeClass: string }
> = {
  PAID:      { label: "Paid",      icon: CheckCircle2,  badgeClass: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  PENDING:   { label: "Pending",   icon: Clock,         badgeClass: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  OVERDUE:   { label: "Overdue",   icon: AlertTriangle, badgeClass: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  CANCELLED: { label: "Cancelled", icon: XCircle,       badgeClass: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
};

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { page, status } = await searchParams;
  const currentPage = page ? parseInt(page, 10) : 1;
  const limit = 20;
  const skip  = (currentPage - 1) * limit;

  const where: any = status ? { status } : {};

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { name: true } },
        jobCard:  { select: { id: true, vehicle: { select: { numberPlate: true } } } },
        payments: { select: { amount: true } },
      },
    }),
    prisma.invoice.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div>
        <h1 className="text-xl font-bold md:text-2xl">Payments & Invoices</h1>
        <p className="text-sm text-muted-foreground">{total} invoices total</p>
      </div>

      {/* ── Status filter tabs ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        <Link
          href="/invoices"
          className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
            !status
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          All
        </Link>
        {Object.entries(statusConfig).map(([key, { label, icon: Icon }]) => (
          <Link
            key={key}
            href={status === key ? "/invoices" : `/invoices?status=${key}`}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
              status === key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            <Icon className="size-3.5" />
            {label}
          </Link>
        ))}
      </div>

      {/* ── Invoice list ── */}
      <div className="space-y-2">
        {invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16 text-center">
            <Receipt className="mb-3 size-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">No invoices found</p>
          </div>
        ) : (
          invoices.map((inv: any) => {
            const scfg = statusConfig[inv.status] ?? statusConfig.PENDING;
            const StatusIcon = scfg.icon;
            const totalPaid  = inv.payments.reduce((s: number, p: any) => s + Number(p.amount), 0);
            const balance    = Number(inv.total) - totalPaid;

            return (
              <Link
                key={inv.id}
                href={`/invoices/${inv.id}`}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
              >
                {/* Icon */}
                <div className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                  inv.status === "PAID" ? "bg-green-100 dark:bg-green-900/30" : "bg-muted"
                }`}>
                  <StatusIcon className={`size-4 ${
                    inv.status === "PAID"
                      ? "text-green-600 dark:text-green-400"
                      : "text-muted-foreground"
                  }`} />
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-sm font-semibold">{inv.invoiceNumber}</p>
                    {inv.jobCard?.vehicle?.numberPlate && (
                      <span className="text-xs text-muted-foreground">
                        · {inv.jobCard.vehicle.numberPlate}
                      </span>
                    )}
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${scfg.badgeClass}`}>
                      {scfg.label}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="size-3" />
                      {inv.customer.name}
                    </span>
                    <span className="hidden sm:block">· {formatDate(inv.createdAt)}</span>
                  </div>
                  {balance > 0 && inv.status !== "PAID" && (
                    <p className="mt-0.5 text-xs font-medium text-orange-600 dark:text-orange-400">
                      Balance due: {formatCurrency(balance)}
                    </p>
                  )}
                </div>

                {/* Amount */}
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold text-foreground">
                    {formatCurrency(inv.total)}
                  </p>
                  {totalPaid > 0 && inv.status !== "PAID" && (
                    <p className="text-xs text-green-600 dark:text-green-400">
                      Paid: {formatCurrency(totalPaid)}
                    </p>
                  )}
                </div>

                <ChevronRight className="size-4 text-muted-foreground/50 shrink-0 ml-1" />
              </Link>
            );
          })
        )}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-2">
          {currentPage > 1 && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/invoices?page=${currentPage - 1}${status ? `&status=${status}` : ""}`}>
                Previous
              </Link>
            </Button>
          )}
          <span className="flex items-center px-2 text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          {currentPage < totalPages && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/invoices?page=${currentPage + 1}${status ? `&status=${status}` : ""}`}>
                Next
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

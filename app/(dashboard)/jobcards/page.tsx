import Link from "next/link";
import { getJobCards } from "@/app/actions/jobcards";
import { getSelectedBranchId } from "@/lib/branch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Plus,
  ScanLine,
  FileText,
  CheckCircle2,
  Clock,
  Archive,
  ChevronRight,
  User,
  CreditCard,
} from "lucide-react";

type SearchParams = { status?: string; page?: string };

// ── Helpers ────────────────────────────────────────────────────────────────

const statusConfig: Record<
  string,
  { label: string; icon: React.ElementType; badgeClass: string }
> = {
  OPEN:        { label: "Open",        icon: FileText,     badgeClass: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  IN_PROGRESS: { label: "In Progress", icon: Clock,        badgeClass: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  COMPLETED:   { label: "Completed",   icon: CheckCircle2, badgeClass: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  CLOSED:      { label: "Closed",      icon: Archive,      badgeClass: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
};

const paymentConfig: Record<
  string,
  { label: string; badgeClass: string }
> = {
  PENDING:   { label: "Unpaid",        badgeClass: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  PAID:      { label: "Paid",          badgeClass: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  OVERDUE:   { label: "Overdue",       badgeClass: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  CANCELLED: { label: "Cancelled",     badgeClass: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
};

// ── Page ───────────────────────────────────────────────────────────────────

export default async function JobCardsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { status, page } = await searchParams;
  const branchId = await getSelectedBranchId();
  const { items, total, page: currentPage, totalPages } = await getJobCards({
    status:   status ?? undefined,
    page:     page ? parseInt(page, 10) : 1,
    limit:    20,
    branchId: branchId ?? undefined,
  });

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold md:text-2xl">Job Cards</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/jobcards/scan">
              <ScanLine className="mr-1.5 size-4" />
              Scan Plate
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/jobcards/new">
              <Plus className="mr-1.5 size-4" />
              New Job Card
            </Link>
          </Button>
        </div>
      </div>

      {/* ── Status filter tabs ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        <Link
          href="/jobcards"
          className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
            !status
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          All
          <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-bold">
            {!status ? total : ""}
          </span>
        </Link>
        {Object.entries(statusConfig).map(([key, { label, icon: Icon }]) => (
          <Link
            key={key}
            href={status === key ? "/jobcards" : `/jobcards?status=${key}`}
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

      {/* ── List ── */}
      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16 text-center">
            <FileText className="mb-3 size-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">No job cards found</p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              {status ? `No ${statusConfig[status]?.label.toLowerCase()} job cards` : "Create your first job card"}
            </p>
            <Button asChild size="sm" className="mt-4">
              <Link href="/jobcards/new">
                <Plus className="mr-1.5 size-4" />
                New Job Card
              </Link>
            </Button>
          </div>
        ) : (
          items.map((jc: any) => {
            const scfg = statusConfig[jc.status] ?? statusConfig.OPEN;
            const StatusIcon = scfg.icon;
            const payStatus = jc.invoice?.status;
            const pcfg = payStatus ? paymentConfig[payStatus] : null;

            // Compute payment display amount
            const paidAmount = jc.payments.reduce(
              (sum: number, p: any) => sum + Number(p.amount),
              0
            );

            return (
              <Link
                key={jc.id}
                href={`/jobcards/${jc.id}`}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
              >
                {/* Status icon */}
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
                  <StatusIcon className="size-4 text-muted-foreground" />
                </div>

                {/* Main info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm text-foreground">
                      {jc.vehicle?.numberPlate}
                    </p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${scfg.badgeClass}`}>
                      {scfg.label}
                    </span>
                    {pcfg && (
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${pcfg.badgeClass}`}>
                        {pcfg.label}
                      </span>
                    )}
                    {!jc.invoice && (
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                        No Invoice
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="size-3" />
                      {jc.customer?.name}
                    </span>
                    {jc.technician && (
                      <span className="hidden sm:flex items-center gap-1">
                        · {jc.technician.name}
                      </span>
                    )}
                    <span className="hidden sm:block">· {formatDate(jc.createdAt)}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground sm:hidden">
                    {formatDate(jc.createdAt)}
                  </p>
                </div>

                {/* Amount + chevron */}
                <div className="flex items-center gap-1 shrink-0">
                  {paidAmount > 0 && (
                    <div className="flex items-center gap-1 text-right">
                      <CreditCard className="size-3 text-muted-foreground" />
                      <span className="text-xs font-medium text-green-600 dark:text-green-400">
                        {formatCurrency(paidAmount)}
                      </span>
                    </div>
                  )}
                  {jc.estimatedCost != null && paidAmount === 0 && (
                    <span className="text-xs font-medium text-muted-foreground">
                      {formatCurrency(jc.estimatedCost)}
                    </span>
                  )}
                  <ChevronRight className="size-4 text-muted-foreground/50 ml-1" />
                </div>
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
              <Link
                href={`/jobcards?page=${currentPage - 1}${status ? `&status=${status}` : ""}`}
              >
                Previous
              </Link>
            </Button>
          )}
          <span className="flex items-center px-2 text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          {currentPage < totalPages && (
            <Button variant="outline" size="sm" asChild>
              <Link
                href={`/jobcards?page=${currentPage + 1}${status ? `&status=${status}` : ""}`}
              >
                Next
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

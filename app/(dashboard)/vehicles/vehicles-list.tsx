"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { Search, Car, User, ChevronRight, Clock, CheckCircle2, FileText } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

type LatestJobCard = {
  id: string;
  status: string;
  createdAt: Date | string;
  invoice: { status: string } | null;
};

type Vehicle = {
  id: string;
  numberPlate: string;
  make: string | null;
  model: string | null;
  year: number | null;
  customer: { name: string; phone: string };
  jobCards?: LatestJobCard[];
};

// ── Status helpers ─────────────────────────────────────────────────────────

const jobStatusBadge: Record<string, { label: string; cls: string }> = {
  OPEN:        { label: "Open",        cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  IN_PROGRESS: { label: "In Progress", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  COMPLETED:   { label: "Completed",   cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  CLOSED:      { label: "Closed",      cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
};

const payStatusBadge: Record<string, { label: string; cls: string }> = {
  PENDING:   { label: "Unpaid",    cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  PAID:      { label: "Paid",      cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  OVERDUE:   { label: "Overdue",   cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  CANCELLED: { label: "Cancelled", cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
};

// ── Component ─────────────────────────────────────────────────────────────

export function VehiclesList({
  vehicles,
  totalPages,
  currentPage,
  search,
}: {
  vehicles: Vehicle[];
  totalPages: number;
  currentPage: number;
  search: string;
}) {
  const router        = useRouter();
  const searchParams  = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const q = (form.elements.namedItem("q") as HTMLInputElement)?.value ?? "";
    const params = new URLSearchParams(searchParams.toString());
    if (q) params.set("search", q);
    else params.delete("search");
    params.delete("page");
    startTransition(() => router.push(`/vehicles?${params.toString()}`));
  }

  return (
    <div className="space-y-4">
      {/* ── Search ── */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={search}
            placeholder="Search by plate, make or model…"
            className="pl-9"
          />
        </div>
        <Button type="submit" disabled={isPending} size="default">
          {isPending ? "…" : "Search"}
        </Button>
      </form>

      {/* ── List ── */}
      {vehicles.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16 text-center">
          <Car className="mb-3 size-10 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">No vehicles found</p>
          {search && (
            <p className="mt-1 text-xs text-muted-foreground/70">Try a different search term</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {vehicles.map((v: any) => {
            const latest = v.jobCards?.[0];
            const jsCfg  = latest ? jobStatusBadge[latest.status] : null;
            const payCfg = latest?.invoice
              ? payStatusBadge[latest.invoice.status]
              : null;

            return (
              <Link
                key={v.id}
                href={`/vehicles/${v.id}`}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
              >
                {/* Icon */}
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Car className="size-4 text-muted-foreground" />
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="font-semibold text-sm text-foreground">
                      {v.numberPlate}
                    </p>
                    {/* Service status */}
                    {jsCfg && (
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${jsCfg.cls}`}>
                        {jsCfg.label}
                      </span>
                    )}
                    {/* Payment status */}
                    {payCfg && (
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${payCfg.cls}`}>
                        {payCfg.label}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="size-3" />
                      {v.customer.name}
                    </span>
                    {v.make && (
                      <span className="hidden sm:block">
                        · {v.make} {v.model ?? ""} {v.year ?? ""}
                      </span>
                    )}
                  </div>
                  {latest && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Last job: {formatDate(latest.createdAt)}
                    </p>
                  )}
                </div>

                <ChevronRight className="size-4 text-muted-foreground/50 shrink-0" />
              </Link>
            );
          })}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-2">
          {currentPage > 1 && (
            <Button variant="outline" size="sm" asChild>
              <Link
                href={`/vehicles?page=${currentPage - 1}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
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
                href={`/vehicles?page=${currentPage + 1}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
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

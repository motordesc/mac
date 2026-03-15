import Link from "next/link";
import { getJobCards } from "@/app/actions/jobcards";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus } from "lucide-react";

type SearchParams = { status?: string; page?: string };

export default async function JobCardsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { status, page } = await searchParams;
  const { items, total, page: currentPage, totalPages } = await getJobCards({
    status: status ?? undefined,
    page: page ? parseInt(page, 10) : 1,
    limit: 20,
  });

  const statusLabels: Record<string, string> = {
    OPEN: "Open",
    IN_PROGRESS: "In Progress",
    COMPLETED: "Completed",
    CLOSED: "Closed",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Job Cards</h1>
        <Button asChild size="lg">
          <Link href="/jobcards/new">
            <Plus className="mr-2 size-5" />
            New Job Card
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {["OPEN", "IN_PROGRESS", "COMPLETED", "CLOSED"].map((s) => (
          <Button key={s} variant={status === s ? "default" : "outline"} size="sm" asChild>
            <Link href={status === s ? "/jobcards" : `/jobcards?status=${s}`}>
              {statusLabels[s]}
            </Link>
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Job Cards ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No job cards found.</p>
          ) : (
            <div className="space-y-3">
              {items.map((jc) => (
                <Link
                  key={jc.id}
                  href={`/jobcards/${jc.id}`}
                  className="block rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">
                        {jc.vehicle?.numberPlate} – {jc.customer?.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {jc.technician?.name ?? "Unassigned"} · {formatDate(jc.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{statusLabels[jc.status]}</Badge>
                      {jc.estimatedCost != null && (
                        <span className="text-sm font-medium">
                          {formatCurrency(jc.estimatedCost)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          {totalPages > 1 && (
            <div className="mt-4 flex justify-center gap-2">
              {currentPage > 1 && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/jobcards?page=${currentPage - 1}${status ? `&status=${status}` : ""}`}>
                    Previous
                  </Link>
                </Button>
              )}
              <span className="flex items-center px-2 text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              {currentPage < totalPages && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/jobcards?page=${currentPage + 1}${status ? `&status=${status}` : ""}`}>
                    Next
                  </Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

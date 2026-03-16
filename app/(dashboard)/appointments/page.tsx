import { prisma } from "@/lib/prisma";
import { getAppointments } from "@/app/actions/appointments";
import { getCurrentRole } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import Link from "next/link";
import { NewAppointmentDialog } from "./new-appointment-dialog";

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  SCHEDULED: "secondary",
  CONFIRMED: "default",
  COMPLETED: "outline",
  CANCELLED: "destructive",
  NO_SHOW: "destructive",
};

type SearchParams = { page?: string; upcoming?: string };

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { page, upcoming } = await searchParams;
  const showUpcoming = upcoming !== "0";
  const currentPage = page ? parseInt(page, 10) : 1;
  const role = await getCurrentRole();
  const canCreate = role === "Admin" || role === "Manager";

  const [{ items, total, totalPages }, customers, vehicles] = await Promise.all([
    getAppointments({ upcoming: showUpcoming, page: currentPage, limit: 20 }),
    canCreate
      ? prisma.customer.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, phone: true } })
      : Promise.resolve([]),
    canCreate
      ? prisma.vehicle.findMany({ orderBy: { numberPlate: "asc" }, select: { id: true, numberPlate: true, customerId: true } })
      : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Appointments</h1>
        {canCreate && <NewAppointmentDialog customers={customers} vehicles={vehicles} />}
      </div>

      <div className="flex gap-2">
        <Button variant={showUpcoming ? "default" : "outline"} size="sm" asChild>
          <Link href="/appointments">Upcoming</Link>
        </Button>
        <Button variant={!showUpcoming ? "default" : "outline"} size="sm" asChild>
          <Link href="/appointments?upcoming=0">All</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {showUpcoming ? "Upcoming" : "All"} Appointments ({total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No appointments found.</p>
          ) : (
            <div className="space-y-3">
              {items.map((a: any) => (
                <div
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-4"
                >
                  <div>
                    <p className="font-medium">{a.customer.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(a.scheduledAt)} · {a.vehicle?.numberPlate ?? "No vehicle"} · {a.customer.phone}
                    </p>
                    {a.notes && (
                      <p className="mt-1 text-xs text-muted-foreground">{a.notes}</p>
                    )}
                  </div>
                  <Badge variant={statusVariant[a.status] ?? "secondary"}>
                    {a.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-4 flex justify-center gap-2">
              {currentPage > 1 && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/appointments?page=${currentPage - 1}${showUpcoming ? "" : "&upcoming=0"}`}>
                    Previous
                  </Link>
                </Button>
              )}
              <span className="flex items-center px-2 text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              {currentPage < totalPages && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/appointments?page=${currentPage + 1}${showUpcoming ? "" : "&upcoming=0"}`}>
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


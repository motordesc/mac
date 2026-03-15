import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";

export default async function AppointmentsPage() {
  const appointments = await prisma.appointment.findMany({
    take: 30,
    orderBy: { scheduledAt: "asc" },
    include: {
      customer: { select: { name: true, phone: true } },
      vehicle: { select: { numberPlate: true } },
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Appointments</h1>
      <Card>
        <CardHeader>
          <CardTitle>Upcoming ({appointments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No appointments.</p>
          ) : (
            <div className="space-y-3">
              {appointments.map((a) => (
                <div
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-4"
                >
                  <div>
                    <p className="font-medium">{a.customer.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(a.scheduledAt)} · {a.vehicle?.numberPlate ?? "—"}
                    </p>
                  </div>
                  <span className="text-sm">{a.status}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

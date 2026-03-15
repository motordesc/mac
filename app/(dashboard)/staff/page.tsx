import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function StaffPage() {
  const staff = await prisma.staff.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { jobCards: true } } },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Staff</h1>
      <Card>
        <CardHeader>
          <CardTitle>Team ({staff.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {staff.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No staff added.</p>
          ) : (
            <div className="space-y-3">
              {staff.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-4"
                >
                  <div>
                    <p className="font-medium">{s.name}</p>
                    <p className="text-sm text-muted-foreground">{s.role} · {s.phone ?? "—"}</p>
                  </div>
                  <span className="text-sm text-muted-foreground">{s._count.jobCards} job cards</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

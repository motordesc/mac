import Link from "next/link";
import { notFound } from "next/navigation";
import { getJobCardById } from "@/app/actions/jobcards";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

const statusLabels: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CLOSED: "Closed",
};

export default async function JobCardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const jc = await getJobCardById(id);
  if (!jc) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/jobcards">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">Job Card</h1>
          <p className="text-muted-foreground">
            {jc.vehicle.numberPlate} · {jc.customer.name}
          </p>
        </div>
        <Badge variant="secondary">{statusLabels[jc.status]}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Vehicle & Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="font-medium">Vehicle:</span> {jc.vehicle.numberPlate}{" "}
              {jc.vehicle.make && `${jc.vehicle.make} ${jc.vehicle.model ?? ""}`} {jc.vehicle.year ?? ""}
            </p>
            <p>
              <span className="font-medium">Customer:</span> {jc.customer.name} · {jc.customer.phone}
            </p>
            <p>
              <span className="font-medium">Technician:</span>{" "}
              {jc.technician?.name ?? "Unassigned"}
            </p>
            {jc.estimatedCost != null && (
              <p>
                <span className="font-medium">Estimated:</span> {formatCurrency(jc.estimatedCost)}
              </p>
            )}
            {jc.serviceDueDate && (
              <p>
                <span className="font-medium">Due:</span> {formatDate(jc.serviceDueDate)}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Services & Parts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {jc.services.length === 0 && jc.parts.length === 0 ? (
              <p className="text-muted-foreground">No services or parts added.</p>
            ) : (
              <>
                {jc.services.map((s) => (
                  <p key={s.id}>
                    {s.service.name} × {s.quantity} – {formatCurrency(s.unitPrice)}
                  </p>
                ))}
                {jc.parts.map((p) => (
                  <p key={p.id}>
                    {p.inventoryItem.name} × {p.quantity} – {formatCurrency(p.unitPrice)}
                  </p>
                ))}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {jc.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{jc.notes}</p>
          </CardContent>
        </Card>
      )}

      {jc.invoice && (
        <div className="flex gap-2">
          <Button asChild>
            <Link href={`/invoices/${jc.invoice.id}`}>View Invoice</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

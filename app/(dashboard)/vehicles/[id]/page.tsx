import Link from "next/link";
import { notFound } from "next/navigation";
import { getVehicleById } from "@/app/actions/vehicles";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vehicle = await getVehicleById(id);
  if (!vehicle) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/vehicles"><ArrowLeft className="size-5" /></Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">{vehicle.numberPlate}</h1>
          <p className="text-muted-foreground">
            {vehicle.make} {vehicle.model} {vehicle.year ?? ""}
          </p>
        </div>
      </div>
      <Card>
        <CardHeader><CardTitle>Owner</CardTitle></CardHeader>
        <CardContent>
          <Link href={`/customers/${vehicle.customer.id}`} className="font-medium text-primary hover:underline">
            {vehicle.customer.name}
          </Link>
          <p className="text-sm text-muted-foreground">{vehicle.customer.phone}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Service history</CardTitle></CardHeader>
        <CardContent>
          {vehicle.jobCards.length === 0 ? (
            <p className="text-muted-foreground">No job cards yet.</p>
          ) : (
            <ul className="space-y-2">
              {vehicle.jobCards.map((jc: any) => (
                <li key={jc.id}>
                  <Link href={`/jobcards/${jc.id}`} className="font-medium text-primary hover:underline">
                    {formatDate(jc.createdAt)}
                  </Link>
                  <span className="ml-2 text-sm text-muted-foreground">{jc.status} · {jc.technician?.name ?? "—"}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

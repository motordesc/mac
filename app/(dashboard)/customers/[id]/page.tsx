import Link from "next/link";
import { notFound } from "next/navigation";
import { getCustomerById } from "@/app/actions/customers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, Plus } from "lucide-react";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await getCustomerById(id);
  if (!customer) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/customers">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">{customer.name}</h1>
          <p className="text-muted-foreground">{customer.phone}</p>
        </div>
        <Button asChild>
          <Link href={`/jobcards/new?customerId=${customer.id}`}>
            <Plus className="mr-2 size-5" />
            New Job Card
          </Link>
        </Button>
      </div>

      {customer.address && (
        <Card>
          <CardHeader>
            <CardTitle>Address</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{customer.address}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Vehicles ({customer.vehicles.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {customer.vehicles.length === 0 ? (
            <p className="text-muted-foreground">No vehicles. Add one from the Vehicles section.</p>
          ) : (
            <ul className="space-y-2">
              {customer.vehicles.map((v: any) => (
                <li key={v.id}>
                  <Link
                    href={`/vehicles/${v.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {v.numberPlate}
                  </Link>
                  <span className="ml-2 text-sm text-muted-foreground">
                    {v.make} {v.model} {v.year ?? ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Job Cards</CardTitle>
        </CardHeader>
        <CardContent>
          {customer.jobCards.length === 0 ? (
            <p className="text-muted-foreground">No job cards yet.</p>
          ) : (
            <ul className="space-y-2">
              {customer.jobCards.map((jc: any) => (
                <li key={jc.id}>
                  <Link
                    href={`/jobcards/${jc.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {jc.vehicle.numberPlate}
                  </Link>
                  <span className="ml-2 text-sm text-muted-foreground">
                    {formatDate(jc.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import Link from "next/link";
import { getVehicles } from "@/app/actions/vehicles";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { VehiclesList } from "./vehicles-list";

type SearchParams = { search?: string; page?: string };

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { search, page } = await searchParams;
  const { items, total, page: currentPage, totalPages } = await getVehicles({
    search: search ?? undefined,
    page: page ? parseInt(page, 10) : 1,
    limit: 20,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Vehicles</h1>
        <Button asChild size="lg">
          <Link href="/vehicles/new">
            <Plus className="mr-2 size-5" />
            New Vehicle
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Vehicles ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          <VehiclesList
            vehicles={items}
            totalPages={totalPages}
            currentPage={currentPage}
            search={search ?? ""}
          />
        </CardContent>
      </Card>
    </div>
  );
}

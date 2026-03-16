import Link from "next/link";
import { getVehicles } from "@/app/actions/vehicles";
import { Button } from "@/components/ui/button";
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
    page:   page ? parseInt(page, 10) : 1,
    limit:  20,
  });

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold md:text-2xl">Vehicles</h1>
          <p className="text-sm text-muted-foreground">{total} vehicles registered</p>
        </div>
        <Button asChild size="sm">
          <Link href="/vehicles/new">
            <Plus className="mr-1.5 size-4" />
            New Vehicle
          </Link>
        </Button>
      </div>

      {/* ── Search + List ── */}
      <VehiclesList
        vehicles={items}
        totalPages={totalPages}
        currentPage={currentPage}
        search={search ?? ""}
      />
    </div>
  );
}

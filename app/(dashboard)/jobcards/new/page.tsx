import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { JobCardForm } from "./jobcard-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

type SearchParams = { customerId?: string; vehicleId?: string; plate?: string };

export default async function NewJobCardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const [customers, vehicles, staff] = await Promise.all([
    prisma.customer.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, phone: true } }),
    prisma.vehicle.findMany({
      orderBy: { numberPlate: "asc" },
      include: { customer: { select: { id: true, name: true } } },
    }),
    prisma.staff.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, role: true } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/jobcards">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">New Job Card</h1>
        <Button variant="outline" size="sm" asChild className="ml-auto">
          <Link href="/jobcards/scan">Scan plate</Link>
        </Button>
      </div>
      <JobCardForm
        customers={customers}
        vehicles={vehicles}
        staff={staff}
        initialCustomerId={params.customerId}
        initialVehicleId={params.vehicleId}
        initialPlate={params.plate}
      />
    </div>
  );
}

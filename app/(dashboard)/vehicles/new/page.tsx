import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { VehicleForm } from "./vehicle-form";

export default async function NewVehiclePage() {
  const customers = await prisma.customer.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, phone: true },
  });
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/vehicles"><ArrowLeft className="size-5" /></Link>
        </Button>
        <h1 className="text-2xl font-semibold">New Vehicle</h1>
      </div>
      <VehicleForm customers={customers} />
    </div>
  );
}

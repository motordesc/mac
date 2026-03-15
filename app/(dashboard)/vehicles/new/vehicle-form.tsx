"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createVehicleSchema, type CreateVehicleInput } from "@/lib/validations/vehicle";
import { createVehicle } from "@/app/actions/vehicles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type Customer = { id: string; name: string; phone: string };

export function VehicleForm({ customers }: { customers: Customer[] }) {
  const router = useRouter();
  const form = useForm<CreateVehicleInput>({
    resolver: zodResolver(createVehicleSchema),
    defaultValues: { numberPlate: "", make: "", model: "", year: undefined, vin: "" },
  });

  async function onSubmit(data: CreateVehicleInput) {
    try {
      const fd = new FormData();
      fd.set("customerId", data.customerId);
      fd.set("numberPlate", data.numberPlate);
      if (data.make) fd.set("make", data.make);
      if (data.model) fd.set("model", data.model);
      if (data.year != null) fd.set("year", String(data.year));
      if (data.vin) fd.set("vin", data.vin);
      const created = await createVehicle(fd);
      toast.success("Vehicle created");
      router.push(`/vehicles/${created.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create vehicle");
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Card>
        <CardHeader><CardTitle>Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customerId">Customer</Label>
            <Select onValueChange={(v) => form.setValue("customerId", v)} value={form.watch("customerId") ?? ""}>
              <SelectTrigger id="customerId"><SelectValue placeholder="Select customer" /></SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name} ({c.phone})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.customerId && (
              <p className="text-sm text-destructive">{form.formState.errors.customerId.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="numberPlate">Number plate</Label>
            <Input id="numberPlate" {...form.register("numberPlate")} />
            {form.formState.errors.numberPlate && (
              <p className="text-sm text-destructive">{form.formState.errors.numberPlate.message}</p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="make">Make</Label>
              <Input id="make" {...form.register("make")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input id="model" {...form.register("model")} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input id="year" type="number" {...form.register("year", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vin">VIN</Label>
              <Input id="vin" {...form.register("vin")} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="lg">Create Vehicle</Button>
            <Button type="button" variant="outline" size="lg" onClick={() => router.back()}>Cancel</Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

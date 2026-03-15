"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createJobCardSchema, type CreateJobCardInput } from "@/lib/validations/jobcard";
import { createJobCard } from "@/app/actions/jobcards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { JOB_CARD_STATUSES } from "@/lib/constants";
import { toast } from "sonner";

type Customer = { id: string; name: string; phone: string };
type Vehicle = { id: string; numberPlate: string; make: string | null; model: string | null; customerId: string; customer: { id: string; name: string } };
type StaffMember = { id: string; name: string; role: string };

export function JobCardForm({
  customers,
  vehicles,
  staff,
  initialCustomerId,
  initialVehicleId,
  initialPlate,
}: {
  customers: Customer[];
  vehicles: Vehicle[];
  staff: StaffMember[];
  initialCustomerId?: string;
  initialVehicleId?: string;
  initialPlate?: string;
}) {
  const router = useRouter();
  const form = useForm<CreateJobCardInput>({
    resolver: zodResolver(createJobCardSchema),
    defaultValues: {
      customerId: initialCustomerId ?? "",
      vehicleId: initialVehicleId ?? "",
      status: "OPEN",
      estimatedCost: undefined,
      notes: initialPlate ? `Vehicle plate from scan: ${initialPlate}` : "",
      serviceDueDate: undefined,
      technicianId: null,
    },
  });

  useEffect(() => {
    if (initialCustomerId) form.setValue("customerId", initialCustomerId);
    if (initialVehicleId) form.setValue("vehicleId", initialVehicleId);
  }, [initialCustomerId, initialVehicleId, form]);

  const selectedCustomerId = form.watch("customerId");
  const filteredVehicles = selectedCustomerId
    ? vehicles.filter((v) => v.customerId === selectedCustomerId)
    : vehicles;

  async function onSubmit(data: CreateJobCardInput) {
    try {
      const fd = new FormData();
      fd.set("vehicleId", data.vehicleId);
      fd.set("customerId", data.customerId);
      if (data.technicianId) fd.set("technicianId", data.technicianId);
      fd.set("status", data.status);
      if (data.estimatedCost != null) fd.set("estimatedCost", String(data.estimatedCost));
      if (data.notes) fd.set("notes", data.notes);
      if (data.serviceDueDate) fd.set("serviceDueDate", new Date(data.serviceDueDate).toISOString().slice(0, 10));
      const created = await createJobCard(fd);
      toast.success("Job card created");
      router.push(`/jobcards/${created.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create job card");
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="customerId">Customer</Label>
              <Select
                onValueChange={(v) => {
                  form.setValue("customerId", v);
                  form.setValue("vehicleId", "");
                }}
                value={form.watch("customerId") ?? ""}
              >
                <SelectTrigger id="customerId">
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} ({c.phone})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicleId">Vehicle</Label>
              <Select
                onValueChange={(v) => form.setValue("vehicleId", v)}
                value={form.watch("vehicleId") ?? ""}
                disabled={!selectedCustomerId}
              >
                <SelectTrigger id="vehicleId">
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {filteredVehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.numberPlate} {v.make ? `- ${v.make} ${v.model ?? ""}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="technicianId">Technician</Label>
              <Select
                onValueChange={(v) => form.setValue("technicianId", v)}
                value={form.watch("technicianId") ?? ""}
              >
                <SelectTrigger id="technicianId">
                  <SelectValue placeholder="Assign technician" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({s.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                onValueChange={(v) => form.setValue("status", v as CreateJobCardInput["status"])}
                value={form.watch("status")}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {JOB_CARD_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="estimatedCost">Estimated Cost (₹)</Label>
              <Input
                id="estimatedCost"
                type="number"
                min={0}
                step={0.01}
                {...form.register("estimatedCost", { valueAsNumber: true })}
              />
              {form.formState.errors.estimatedCost && (
                <p className="text-sm text-destructive">{form.formState.errors.estimatedCost.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="serviceDueDate">Service Due Date</Label>
              <Input
                id="serviceDueDate"
                type="date"
                {...form.register("serviceDueDate")}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...form.register("notes")}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="lg">
              Create Job Card
            </Button>
            <Button type="button" variant="outline" size="lg" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { User, Car, Wrench, FileText, Info } from "lucide-react";

type Customer    = { id: string; name: string; phone: string };
type Vehicle     = {
  id: string;
  numberPlate: string;
  make: string | null;
  model: string | null;
  customerId: string;
  customer: { id: string; name: string };
};
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
  const form   = useForm<CreateJobCardInput>({
    resolver: zodResolver(createJobCardSchema),
    defaultValues: {
      customerId:    initialCustomerId ?? "",
      vehicleId:     initialVehicleId  ?? "",
      // Default to OPEN — payment is always Pending initially
      status:        "OPEN",
      estimatedCost: undefined,
      notes:         initialPlate ? `Vehicle plate from scan: ${initialPlate}` : "",
      serviceDueDate: undefined,
      technicianId:  null,
    },
  });

  useEffect(() => {
    if (initialCustomerId) form.setValue("customerId", initialCustomerId);
    if (initialVehicleId)  form.setValue("vehicleId",  initialVehicleId);
  }, [initialCustomerId, initialVehicleId, form]);

  const selectedCustomerId = form.watch("customerId");
  const filteredVehicles   = selectedCustomerId
    ? vehicles.filter((v) => v.customerId === selectedCustomerId)
    : vehicles;

  async function onSubmit(data: CreateJobCardInput) {
    try {
      const fd = new FormData();
      fd.set("vehicleId",  data.vehicleId);
      fd.set("customerId", data.customerId);
      if (data.technicianId) fd.set("technicianId", data.technicianId);
      fd.set("status", data.status);
      if (data.estimatedCost != null)
        fd.set("estimatedCost", String(data.estimatedCost));
      if (data.notes) fd.set("notes", data.notes);
      if (data.serviceDueDate)
        fd.set(
          "serviceDueDate",
          new Date(data.serviceDueDate).toISOString().slice(0, 10)
        );
      const created = await createJobCard(fd);
      toast.success("Job card created successfully");
      router.push(`/jobcards/${created.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create job card");
    }
  }

  const isSubmitting = form.formState.isSubmitting;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {/* ── Payment notice ── */}
      <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 dark:border-amber-800 dark:bg-amber-900/20">
        <Info className="size-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
        <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
          Payment status will be <strong>Pending</strong> by default. Mark as paid after
          service completion via the Invoice.
        </p>
      </div>

      {/* ── Customer & Vehicle ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <User className="size-4 text-muted-foreground" />
            Customer & Vehicle
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Customer select */}
          <div className="space-y-1.5">
            <Label htmlFor="customerId">
              Customer <span className="text-destructive">*</span>
            </Label>
            <Select
              onValueChange={(v) => {
                form.setValue("customerId", v);
                form.setValue("vehicleId", "");
              }}
              value={form.watch("customerId") ?? ""}
            >
              <SelectTrigger id="customerId" className="h-11">
                <SelectValue placeholder="Select customer…" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {c.phone}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.customerId && (
              <p className="text-xs text-destructive">
                {form.formState.errors.customerId.message}
              </p>
            )}
          </div>

          {/* Vehicle select */}
          <div className="space-y-1.5">
            <Label htmlFor="vehicleId">
              Vehicle <span className="text-destructive">*</span>
            </Label>
            <Select
              onValueChange={(v) => form.setValue("vehicleId", v)}
              value={form.watch("vehicleId") ?? ""}
              disabled={!selectedCustomerId}
            >
              <SelectTrigger id="vehicleId" className="h-11">
                <SelectValue
                  placeholder={
                    selectedCustomerId
                      ? filteredVehicles.length === 0
                        ? "No vehicles for this customer"
                        : "Select vehicle…"
                      : "Select a customer first"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {filteredVehicles.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    <span className="flex items-center gap-2">
                      <Car className="size-3.5 text-muted-foreground" />
                      {v.numberPlate}
                      {v.make && (
                        <span className="text-xs text-muted-foreground">
                          {v.make} {v.model ?? ""}
                        </span>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.vehicleId && (
              <p className="text-xs text-destructive">
                {form.formState.errors.vehicleId.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Job Details ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <FileText className="size-4 text-muted-foreground" />
            Job Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Technician */}
          <div className="space-y-1.5">
            <Label htmlFor="technicianId">Technician</Label>
            <Select
              onValueChange={(v) => form.setValue("technicianId", v)}
              value={form.watch("technicianId") ?? ""}
            >
              <SelectTrigger id="technicianId" className="h-11">
                <SelectValue placeholder="Assign technician (optional)" />
              </SelectTrigger>
              <SelectContent>
                {staff.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <span className="flex items-center gap-2">
                      <Wrench className="size-3.5 text-muted-foreground" />
                      {s.name}
                      <span className="text-xs text-muted-foreground capitalize">
                        {s.role.toLowerCase()}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cost + Due Date */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="estimatedCost">Estimated Cost (₹)</Label>
              <Input
                id="estimatedCost"
                type="number"
                min={0}
                step={0.01}
                className="h-11"
                placeholder="0.00"
                {...form.register("estimatedCost", { valueAsNumber: true })}
              />
              {form.formState.errors.estimatedCost && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.estimatedCost.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="serviceDueDate">Service Due Date</Label>
              <Input
                id="serviceDueDate"
                type="date"
                className="h-11"
                {...form.register("serviceDueDate")}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes / Services Required</Label>
            <Textarea
              id="notes"
              className="min-h-[90px] resize-none"
              placeholder="Describe the services required, issues reported by customer…"
              {...form.register("notes")}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Actions ── */}
      <div className="flex gap-3">
        <Button type="submit" size="lg" className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? "Creating…" : "Create Job Card"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createAppointmentSchema, type CreateAppointmentInput } from "@/lib/validations/appointment";
import { createAppointment } from "@/app/actions/appointments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus } from "lucide-react";

type Customer = { id: string; name: string; phone: string };
type Vehicle = { id: string; numberPlate: string; customerId: string };

export function NewAppointmentDialog({
  customers,
  vehicles,
}: {
  customers: Customer[];
  vehicles: Vehicle[];
}) {
  const [open, setOpen] = useState(false);

  const form = useForm<CreateAppointmentInput>({
    resolver: zodResolver(createAppointmentSchema),
    defaultValues: {
      customerId: "",
      vehicleId: null,
      scheduledAt: new Date().toISOString().slice(0, 16) as unknown as Date,
      notes: "",
    },
  });

  const selectedCustomerId = form.watch("customerId");
  const filteredVehicles = selectedCustomerId
    ? vehicles.filter((v) => v.customerId === selectedCustomerId)
    : [];

  async function onSubmit(data: CreateAppointmentInput) {
    try {
      const fd = new FormData();
      fd.set("customerId", data.customerId);
      if (data.vehicleId) fd.set("vehicleId", data.vehicleId);
      fd.set("scheduledAt", new Date(data.scheduledAt).toISOString());
      if (data.notes) fd.set("notes", data.notes);
      await createAppointment(fd);
      toast.success("Appointment booked");
      form.reset();
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to book appointment");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg">
          <Plus className="mr-2 size-5" />
          New Appointment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Book Appointment</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Customer</Label>
            <Select
              onValueChange={(v) => {
                form.setValue("customerId", v);
                form.setValue("vehicleId", null);
              }}
              value={form.watch("customerId")}
            >
              <SelectTrigger>
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
            {form.formState.errors.customerId && (
              <p className="text-sm text-destructive">{form.formState.errors.customerId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Vehicle (optional)</Label>
            <Select
              onValueChange={(v) => form.setValue("vehicleId", v)}
              value={form.watch("vehicleId") ?? ""}
              disabled={!selectedCustomerId || filteredVehicles.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select vehicle" />
              </SelectTrigger>
              <SelectContent>
                {filteredVehicles.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.numberPlate}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Date & Time</Label>
            <Input
              type="datetime-local"
              {...form.register("scheduledAt")}
            />
            {form.formState.errors.scheduledAt && (
              <p className="text-sm text-destructive">{form.formState.errors.scheduledAt.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea {...form.register("notes")} className="min-h-[80px]" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Booking…" : "Book Appointment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useForm } from "react-hook-form";
import { saveGarageSettings } from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type SettingsFormData = {
  garage_name: string;
  tax_rate: string;
};

export function SettingsForm({
  garageName,
  taxRate,
}: {
  garageName: string;
  taxRate: string;
}) {
  const form = useForm<SettingsFormData>({
    defaultValues: { garage_name: garageName, tax_rate: taxRate },
  });

  async function onSubmit(data: SettingsFormData) {
    try {
      const fd = new FormData();
      fd.set("garage_name", data.garage_name);
      fd.set("tax_rate", data.tax_rate);
      await saveGarageSettings(fd);
      toast.success("Settings saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save settings");
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="garage_name">Garage Name</Label>
        <Input
          id="garage_name"
          {...form.register("garage_name", { required: "Garage name is required" })}
        />
        {form.formState.errors.garage_name && (
          <p className="text-sm text-destructive">{form.formState.errors.garage_name.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="tax_rate">Default Tax Rate (%)</Label>
        <Input
          id="tax_rate"
          type="number"
          min={0}
          max={100}
          step="0.01"
          {...form.register("tax_rate", { required: "Tax rate is required" })}
        />
        {form.formState.errors.tax_rate && (
          <p className="text-sm text-destructive">{form.formState.errors.tax_rate.message}</p>
        )}
      </div>
      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Saving…" : "Save Settings"}
        </Button>
      </div>
    </form>
  );
}

import { getGarageSettings } from "@/app/actions/settings";
import { getCurrentRole } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsForm } from "./settings-form";
import { ShieldCheck } from "lucide-react";

export default async function SettingsPage() {
  const [{ garageName, taxRate }, role] = await Promise.all([
    getGarageSettings(),
    getCurrentRole(),
  ]);

  const isAdmin = role === "Admin";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Garage Settings</CardTitle>
        </CardHeader>
        <CardContent>
          {isAdmin ? (
            <SettingsForm garageName={garageName} taxRate={taxRate} />
          ) : (
            <div className="space-y-4">
              <p>
                <span className="font-medium">Garage Name:</span> {garageName}
              </p>
              <p>
                <span className="font-medium">Default Tax Rate:</span> {taxRate}%
              </p>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                <ShieldCheck className="size-4 shrink-0" />
                <span>Only Admins can modify settings.</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


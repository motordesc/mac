import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SettingsPage() {
  const settings = await prisma.garageSettings.findMany();
  const garageName = settings.find((s) => s.key === "garage_name")?.value ?? "Motor Auto Care";
  const taxRate = settings.find((s) => s.key === "tax_rate")?.value ?? "18";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Garage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><span className="font-medium">Name:</span> {garageName}</p>
          <p><span className="font-medium">Default tax rate (%):</span> {taxRate}</p>
        </CardContent>
      </Card>
    </div>
  );
}

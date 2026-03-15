import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { VehicleScanner } from "./vehicle-scanner";

export default function ScanPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/jobcards/new">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">Scan Vehicle Number</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Camera scan</CardTitle>
          <p className="text-sm text-muted-foreground">
            Open the camera, point at the number plate, and capture. We&apos;ll look up the vehicle
            and autofill customer details for a new job card.
          </p>
        </CardHeader>
        <CardContent>
          <VehicleScanner />
        </CardContent>
      </Card>
    </div>
  );
}

import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type Widget = {
  title: string;
  value: string | number;
  href?: string;
};

export function DashboardWidgets({ widgets }: { widgets: Widget[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {widgets.map((w) => (
        <Card key={w.title}>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {w.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {w.href ? (
              <Link
                href={w.href}
                className="text-2xl font-bold text-primary hover:underline"
              >
                {w.value}
              </Link>
            ) : (
              <p className="text-2xl font-bold">{w.value}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ lowStock?: string; page?: string }>;
}) {
  const { lowStock, page } = await searchParams;
  const items = await prisma.inventoryItem.findMany({
    skip: page ? (parseInt(page, 10) - 1) * 20 : 0,
    take: 20,
    orderBy: { name: "asc" },
    include: { supplier: { select: { name: true } } },
  });
  const total = await prisma.inventoryItem.count();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Inventory</h1>
      <Card>
        <CardHeader>
          <CardTitle>Items ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No inventory items.</p>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-4"
                >
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.sku ?? "—"} · {item.supplier?.name ?? "No supplier"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{formatCurrency(item.sellingPrice)}</span>
                    <span className="text-sm text-muted-foreground">Qty: {item.quantity}</span>
                    {item.quantity <= item.minQuantity && (
                      <Badge variant="destructive">Low stock</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

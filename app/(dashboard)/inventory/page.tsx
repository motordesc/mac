import { getInventoryItems } from "@/app/actions/inventory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { getSelectedBranchId } from "@/lib/branch";
import Link from "next/link";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ lowStock?: string; page?: string }>;
}) {
  const { lowStock, page } = await searchParams;
  const isLowStock = lowStock === "1";
  const currentPage = page ? parseInt(page, 10) : 1;

  const branchId = await getSelectedBranchId();

  const { items, total, totalPages } = await getInventoryItems({
    lowStock: isLowStock,
    page: currentPage,
    limit: 20,
    branchId,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Inventory</h1>

      <div className="flex flex-wrap gap-2">
        <Button variant={!isLowStock ? "default" : "outline"} size="sm" asChild>
          <Link href="/inventory">All Items</Link>
        </Button>
        <Button variant={isLowStock ? "default" : "outline"} size="sm" asChild>
          <Link href="/inventory?lowStock=1">Low Stock</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {isLowStock ? "Low Stock Items" : "All Items"} ({total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              {isLowStock ? "No low-stock items. 🎉" : "No inventory items yet."}
            </p>
          ) : (
            <div className="space-y-3">
              {items.map((item: any) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-4"
                >
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.sku ?? "—"} ·{" "}
                      {"supplier" in item && item.supplier
                        ? (item.supplier as { name: string }).name
                        : "No supplier"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{formatCurrency(item.sellingPrice)}</span>
                    <span className="text-sm text-muted-foreground">
                      Qty: {item.quantity} / Min: {item.minQuantity}
                    </span>
                    {item.quantity <= item.minQuantity && (
                      <Badge variant="destructive">Low stock</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-4 flex justify-center gap-2">
              {currentPage > 1 && (
                <Button variant="outline" size="sm" asChild>
                  <Link
                    href={`/inventory?page=${currentPage - 1}${isLowStock ? "&lowStock=1" : ""}`}
                  >
                    Previous
                  </Link>
                </Button>
              )}
              <span className="flex items-center px-2 text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              {currentPage < totalPages && (
                <Button variant="outline" size="sm" asChild>
                  <Link
                    href={`/inventory?page=${currentPage + 1}${isLowStock ? "&lowStock=1" : ""}`}
                  >
                    Next
                  </Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


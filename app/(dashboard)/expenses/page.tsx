import { getExpenses } from "@/app/actions/expenses";
import { getCurrentRole } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ExpenseManager } from "./expense-manager";

type SearchParams = { page?: string };

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { page } = await searchParams;
  const currentPage = page ? parseInt(page, 10) : 1;

  const [{ items, total, totalPages }, role] = await Promise.all([
    getExpenses({ page: currentPage, limit: 20 }),
    getCurrentRole(),
  ]);

  const canManage = role === "Admin" || role === "Manager";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Expenses</h1>
      <Card>
        <CardHeader>
          <CardTitle>Expenses ({total})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ExpenseManager expenses={items} canManage={canManage} />

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-2">
              {currentPage > 1 && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/expenses?page=${currentPage - 1}`}>Previous</Link>
                </Button>
              )}
              <span className="flex items-center px-2 text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              {currentPage < totalPages && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/expenses?page=${currentPage + 1}`}>Next</Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


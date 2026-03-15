import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function ExpensesPage() {
  const expenses = await prisma.expense.findMany({
    take: 50,
    orderBy: { date: "desc" },
  });
  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Expenses</h1>
      <Card>
        <CardHeader>
          <CardTitle>Recent expenses (Total: {formatCurrency(total)})</CardTitle>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No expenses recorded.</p>
          ) : (
            <div className="space-y-3">
              {expenses.map((e) => (
                <div
                  key={e.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-4"
                >
                  <div>
                    <p className="font-medium">{e.category}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(e.date)} {e.description ? `· ${e.description}` : ""}
                    </p>
                  </div>
                  <span className="font-medium">{formatCurrency(e.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

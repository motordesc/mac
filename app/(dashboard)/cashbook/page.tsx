import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { startOfDay, endOfDay, subDays } from "date-fns";

export default async function CashbookPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const dateParam = (await searchParams).date;
  const date = dateParam ? new Date(dateParam) : new Date();
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  const [payments, expenses] = await Promise.all([
    prisma.payment.aggregate({
      where: { paidAt: { gte: dayStart, lte: dayEnd } },
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      where: { date: { gte: dayStart, lte: dayEnd } },
      _sum: { amount: true },
    }),
  ]);

  const income = Number(payments._sum.amount ?? 0);
  const expenseTotal = Number(expenses._sum.amount ?? 0);
  const closingBalance = income - expenseTotal;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Cashbook</h1>
      <Card>
        <CardHeader>
          <CardTitle>Daily summary – {date.toLocaleDateString()}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Income</p>
              <p className="text-xl font-semibold text-green-600">{formatCurrency(income)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Expenses</p>
              <p className="text-xl font-semibold text-red-600">{formatCurrency(expenseTotal)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Closing balance</p>
              <p className="text-xl font-semibold">{formatCurrency(closingBalance)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

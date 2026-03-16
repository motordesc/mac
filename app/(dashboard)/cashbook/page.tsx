import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { startOfDay, endOfDay, format, addDays, subDays, isToday } from "date-fns";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default async function CashbookPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: dateParam } = await searchParams;

  // Validate and parse the date — default to today
  let date: Date;
  try {
    date = dateParam ? new Date(dateParam) : new Date();
    if (isNaN(date.getTime())) throw new Error("invalid");
  } catch {
    date = new Date();
  }

  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);
  const prevDay = format(subDays(date, 1), "yyyy-MM-dd");
  const nextDay = format(addDays(date, 1), "yyyy-MM-dd");
  const todayStr = format(new Date(), "yyyy-MM-dd");

  const [payments, expenses, paymentRows, expenseRows] = await Promise.all([
    prisma.payment.aggregate({
      where: { paidAt: { gte: dayStart, lte: dayEnd } },
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      where: { date: { gte: dayStart, lte: dayEnd } },
      _sum: { amount: true },
    }),
    prisma.payment.findMany({
      where: { paidAt: { gte: dayStart, lte: dayEnd } },
      orderBy: { paidAt: "asc" },
      include: {
        invoice: { select: { invoiceNumber: true } },
      },
    }),
    prisma.expense.findMany({
      where: { date: { gte: dayStart, lte: dayEnd } },
      orderBy: { date: "asc" },
    }),
  ]);

  const income = Number(payments._sum.amount ?? 0);
  const expenseTotal = Number(expenses._sum.amount ?? 0);
  const closingBalance = income - expenseTotal;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Cashbook</h1>

      {/* Date navigation */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/cashbook?date=${prevDay}`}>
            <ChevronLeft className="size-4" />
          </Link>
        </Button>
        <span className="min-w-[160px] text-center font-medium">
          {format(date, "dd MMM yyyy")}
          {isToday(date) && (
            <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
              Today
            </span>
          )}
        </span>
        <Button variant="outline" size="icon" asChild disabled={isToday(date)}>
          <Link href={isToday(date) ? "#" : `/cashbook?date=${nextDay}`}>
            <ChevronRight className="size-4" />
          </Link>
        </Button>
        {!isToday(date) && (
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/cashbook?date=${todayStr}`}>Today</Link>
          </Button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">Income</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-green-600 dark:text-green-400">
              {formatCurrency(income)}
            </p>
            <p className="text-xs text-muted-foreground">{paymentRows.length} payment(s)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-red-600 dark:text-red-400">
              {formatCurrency(expenseTotal)}
            </p>
            <p className="text-xs text-muted-foreground">{expenseRows.length} expense(s)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Closing Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-semibold ${
                closingBalance >= 0
                  ? "text-foreground"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {formatCurrency(closingBalance)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transaction detail */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payments Received</CardTitle>
          </CardHeader>
          <CardContent>
            {paymentRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payments today.</p>
            ) : (
              <div className="space-y-2">
                {paymentRows.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium">{p.method}</span>
                      {p.invoice && (
                        <span className="ml-2 text-muted-foreground">
                          #{p.invoice.invoiceNumber}
                        </span>
                      )}
                    </div>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      +{formatCurrency(p.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Expenses Paid</CardTitle>
          </CardHeader>
          <CardContent>
            {expenseRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No expenses today.</p>
            ) : (
              <div className="space-y-2">
                {expenseRows.map((e) => (
                  <div key={e.id} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium">{e.category}</span>
                      {e.description && (
                        <span className="ml-2 text-muted-foreground">{e.description}</span>
                      )}
                    </div>
                    <span className="font-medium text-red-600 dark:text-red-400">
                      -{formatCurrency(e.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


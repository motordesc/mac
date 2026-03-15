import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { startOfDay, startOfWeek, startOfMonth, subDays } from "date-fns";

export default async function ReportsPage() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);

  const [dailyRevenue, weeklyRevenue, monthlyRevenue, jobCardsCount, expensesTotal] =
    await Promise.all([
      prisma.payment.aggregate({
        where: { paidAt: { gte: todayStart } },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { paidAt: { gte: weekStart } },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { paidAt: { gte: monthStart } },
        _sum: { amount: true },
      }),
      prisma.jobCard.count({
        where: { createdAt: { gte: subDays(now, 30) } },
      }),
      prisma.expense.aggregate({
        where: { date: { gte: monthStart } },
        _sum: { amount: true },
      }),
    ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Reports & Analytics</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Daily revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {formatCurrency(Number(dailyRevenue._sum.amount ?? 0))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Weekly revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {formatCurrency(Number(weeklyRevenue._sum.amount ?? 0))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Monthly revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {formatCurrency(Number(monthlyRevenue._sum.amount ?? 0))}
            </p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Summary (last 30 days)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>Job cards created: {jobCardsCount}</p>
          <p>Monthly expenses: {formatCurrency(Number(expensesTotal._sum.amount ?? 0))}</p>
        </CardContent>
      </Card>
    </div>
  );
}

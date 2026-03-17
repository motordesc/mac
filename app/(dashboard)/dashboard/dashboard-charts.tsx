"use client";

import React from "react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format, parseISO } from "date-fns";

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

type RevenuePoint    = { date: string; revenue: number };
type ServicePoint    = { name: string; count: number };
type VehicleTypePoint = { type: string; count: number };
type StaffPoint      = { name: string; completed: number };

type DashboardChartsProps = {
  revenueData: RevenuePoint[];
  serviceData: ServicePoint[];
  vehicleTypeData: VehicleTypePoint[];
  staffData: StaffPoint[];
};

// ── Error boundary to catch any recharts rendering crash ──────────────────
class ChartErrorBoundary extends React.Component<
  { children: React.ReactNode; fallbackLabel?: string },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallbackLabel?: string }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    console.error("[ChartErrorBoundary]", error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-40 items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground">
          {this.props.fallbackLabel ?? "Chart failed to render."}
        </div>
      );
    }
    return this.props.children;
  }
}

// Format date labels for the x-axis – show day/month only
function formatDay(dateStr: string) {
  try {
    return format(parseISO(dateStr), "d MMM");
  } catch {
    return dateStr;
  }
}

// Safe currency formatter — recharts passes value as string | number | Array
function safeCurrency(value: unknown): string {
  const n = typeof value === "number" ? value : Number(value);
  if (isNaN(n)) return "₹0";
  return `₹${n.toLocaleString("en-IN")}`;
}

export function DashboardCharts({
  revenueData = [],
  serviceData = [],
  vehicleTypeData = [],
  staffData = [],
}: DashboardChartsProps) {
  const revenueConfig = {
    date:    { label: "Date" },
    revenue: { label: "Revenue (₹)" },
  };
  const serviceConfig = {
    name:  { label: "Service" },
    count: { label: "Jobs" },
  };
  const vehicleConfig = {
    type:  { label: "Make" },
    count: { label: "Vehicles" },
  };
  const staffConfig = {
    name:      { label: "Staff" },
    completed: { label: "Completed" },
  };

  // Only show every 5th label on mobile to avoid crowding
  const revenueWithLabels = revenueData.map((d, i) => ({
    ...d,
    displayDate: i % 5 === 0 ? formatDay(d.date) : "",
  }));

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* ── Revenue line chart ── */}
      <ChartErrorBoundary fallbackLabel="Revenue chart unavailable">
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Revenue – Last 30 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={revenueConfig} className="h-56 w-full sm:h-72">
              <LineChart data={revenueWithLabels} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="displayDate"
                  className="text-xs"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  width={50}
                  tickFormatter={(v: number) =>
                    v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`
                  }
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  formatter={(value: any) => [safeCurrency(value), "Revenue"]}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </ChartErrorBoundary>

      {/* ── Service demand bar chart ── */}
      {serviceData.length > 0 && (
        <ChartErrorBoundary fallbackLabel="Service chart unavailable">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Service Demand</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={serviceConfig} className="h-56 w-full">
                <BarChart
                  data={serviceData.slice(0, 8)}
                  layout="vertical"
                  margin={{ left: 4, right: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                  <XAxis
                    type="number"
                    className="text-xs"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={90}
                    className="text-xs"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </ChartErrorBoundary>
      )}

      {/* ── Vehicle types pie chart ── */}
      {vehicleTypeData.length > 0 && (
        <ChartErrorBoundary fallbackLabel="Vehicle chart unavailable">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Vehicle Makes</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={vehicleConfig} className="h-[200px] w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie
                    data={vehicleTypeData.slice(0, 6)}
                    dataKey="count"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    innerRadius={35}
                    paddingAngle={3}
                  >
                    {vehicleTypeData.slice(0, 6).map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
              {/* Legend */}
              <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1">
                {vehicleTypeData.slice(0, 6).map((d, i) => (
                  <span key={d.type} className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span
                      className="inline-block size-2 rounded-full"
                      style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                    {d.type}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </ChartErrorBoundary>
      )}

      {/* ── Staff performance ── */}
      {staffData.length > 0 && (
        <ChartErrorBoundary fallbackLabel="Staff chart unavailable">
          <Card className={vehicleTypeData.length === 0 ? "" : "md:col-span-2"}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Staff Performance (Closed Jobs)</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={staffConfig} className="h-48 w-full">
                <BarChart data={staffData} margin={{ left: 0, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                  <XAxis
                    dataKey="name"
                    className="text-xs"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    className="text-xs"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    width={30}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="completed" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </ChartErrorBoundary>
      )}
    </div>
  );
}

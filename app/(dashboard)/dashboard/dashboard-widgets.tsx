"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  FileText,
  CheckCircle2,
  Archive,
  Clock,
  CreditCard,
  TrendingUp,
  Calendar,
  AlertTriangle,
  Plus,
  Car,
  Wrench,
  Receipt,
  LucideIcon,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

type Widget = {
  title: string;
  value: string | number;
  href?: string;
  icon: LucideIcon;
  color: "blue" | "green" | "slate" | "amber" | "red" | "purple";
  description?: string;
};

type QuickAction = {
  label: string;
  href: string;
  icon: LucideIcon;
  color: "blue" | "green" | "amber" | "purple";
};

// ── Colour maps ────────────────────────────────────────────────────────────

const iconBg: Record<Widget["color"], string> = {
  blue:   "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  green:  "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400",
  slate:  "bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400",
  amber:  "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  red:    "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
  purple: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
};

const actionBg: Record<QuickAction["color"], string> = {
  blue:   "bg-blue-600 hover:bg-blue-700 text-white",
  green:  "bg-green-600 hover:bg-green-700 text-white",
  amber:  "bg-amber-500 hover:bg-amber-600 text-white",
  purple: "bg-purple-600 hover:bg-purple-700 text-white",
};

// ── Widget card ────────────────────────────────────────────────────────────

function WidgetCard({ widget }: { widget: Widget }) {
  const Icon = widget.icon;
  const inner = (
    <div className="flex items-center gap-4">
      <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", iconBg[widget.color])}>
        <Icon className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground truncate">{widget.title}</p>
        <p className="mt-0.5 text-2xl font-bold text-foreground leading-none">{widget.value}</p>
        {widget.description && (
          <p className="mt-1 text-xs text-muted-foreground">{widget.description}</p>
        )}
      </div>
    </div>
  );

  const cardClass =
    "block rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 active:translate-y-0";

  if (widget.href) {
    return (
      <Link href={widget.href} className={cardClass}>
        {inner}
      </Link>
    );
  }
  return <div className={cardClass}>{inner}</div>;
}

// ── Quick action button ────────────────────────────────────────────────────

function QuickActionButton({ action }: { action: QuickAction }) {
  const Icon = action.icon;
  return (
    <Link
      href={action.href}
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-xl p-4 text-center font-medium transition-all active:scale-95",
        actionBg[action.color]
      )}
    >
      <div className="flex size-9 items-center justify-center rounded-full bg-white/20">
        <Icon className="size-5" />
      </div>
      <span className="text-xs leading-tight">{action.label}</span>
    </Link>
  );
}

// ── Exports ────────────────────────────────────────────────────────────────

export function DashboardWidgets({ widgets }: { widgets: Widget[] }) {
  return (
    <div className="grid gap-3 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
      {widgets.map((w: any) => (
        <WidgetCard key={w.title} widget={w} />
      ))}
    </div>
  );
}

export function QuickActions() {
  const actions: QuickAction[] = [
    { label: "New Job Card",      href: "/jobcards/new",   icon: Plus,    color: "blue" },
    { label: "Add Vehicle",       href: "/vehicles/new",   icon: Car,     color: "green" },
    { label: "Register Customer", href: "/customers/new",  icon: Wrench,  color: "purple" },
    { label: "Quick Sale",        href: "/sell",           icon: Receipt, color: "amber" },
  ];

  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Quick Actions
      </h2>
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-4">
        {actions.map((a: any) => (
          <QuickActionButton key={a.href} action={a} />
        ))}
      </div>
    </div>
  );
}

// Re-export icon helpers for use in the dashboard page
export const WIDGET_ICONS = {
  FileText,
  CheckCircle2,
  Archive,
  Clock,
  CreditCard,
  TrendingUp,
  Calendar,
  AlertTriangle,
} as const;

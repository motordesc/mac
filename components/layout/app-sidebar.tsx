"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  Users,
  Car,
  Package,
  UserCog,
  Calendar,
  Receipt,
  Wallet,
  BookOpen,
  BarChart3,
  Bot,
  Settings,
  GitBranch,
  Zap,
  Wrench,
} from "lucide-react";

const navGroups = [
  {
    label: "Main",
    items: [
      { href: "/dashboard",  label: "Dashboard",    icon: LayoutDashboard },
      { href: "/sell",       label: "Quick Sale",   icon: Zap, highlight: true },
      { href: "/jobcards",   label: "Job Cards",    icon: FileText },
      { href: "/vehicles",   label: "Vehicles",     icon: Car },
      { href: "/customers",  label: "Customers",    icon: Users },
    ],
  },
  {
    label: "Financials",
    items: [
      { href: "/invoices",   label: "Invoices",     icon: Receipt },
      { href: "/expenses",   label: "Expenses",     icon: Wallet },
      { href: "/cashbook",   label: "Cashbook",     icon: BookOpen },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/inventory",    label: "Inventory",    icon: Package },
      { href: "/appointments", label: "Appointments", icon: Calendar },
      { href: "/staff",        label: "Staff",        icon: UserCog },
      { href: "/branches",     label: "Branches",     icon: GitBranch },
    ],
  },
  {
    label: "Insights",
    items: [
      { href: "/reports",  label: "Reports",       icon: BarChart3 },
      { href: "/ai",       label: "AI Assistant",  icon: Bot },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/settings", label: "Settings",      icon: Settings },
    ],
  },
] as const;

type NavGroup = (typeof navGroups)[number];
type NavItem = NavGroup["items"][number];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 flex-col border-r border-border bg-card md:flex fixed inset-y-0 left-0 z-30">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 border-b border-border px-4">
        <div className="flex size-7 items-center justify-center rounded-lg bg-primary shrink-0">
          <Wrench className="size-4 text-primary-foreground" />
        </div>
        <span className="font-semibold text-foreground tracking-tight">Motor Auto Care</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {navGroups.map((group: NavGroup) => (
          <div key={group.label}>
            <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item: NavItem) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href || pathname.startsWith(item.href + "/");
                const isHighlight = "highlight" in item && item.highlight;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : isHighlight
                        ? "bg-primary/10 text-primary hover:bg-primary/20"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    {item.label}
                    {isHighlight && !isActive && (
                      <span className="ml-auto rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold text-primary-foreground">
                        NEW
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}

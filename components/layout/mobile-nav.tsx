"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  Car,
  Receipt,
  MoreHorizontal,
  X,
  UserCog,
  BarChart3,
  Wallet,
  Settings,
  Package,
  Calendar,
  BookOpen,
  Users,
  Bot,
  GitBranch,
  Zap,
} from "lucide-react";
import { useState } from "react";

const primaryNavItems = [
  { href: "/dashboard",  label: "Dashboard",  icon: LayoutDashboard },
  { href: "/jobcards",   label: "Job Cards",   icon: FileText },
  { href: "/vehicles",   label: "Vehicles",    icon: Car },
  { href: "/invoices",   label: "Payments",    icon: Receipt },
] as const;

const menuItems = [
  { href: "/customers",    label: "Customers",    icon: Users },
  { href: "/appointments", label: "Appointments", icon: Calendar },
  { href: "/expenses",     label: "Expenses",     icon: Wallet },
  { href: "/cashbook",     label: "Cashbook",     icon: BookOpen },
  { href: "/inventory",    label: "Inventory",    icon: Package },
  { href: "/staff",        label: "Staff",        icon: UserCog },
  { href: "/reports",      label: "Reports",      icon: BarChart3 },
  { href: "/branches",     label: "Branches",     icon: GitBranch },
  { href: "/sell",         label: "Quick Sale",   icon: Zap },
  { href: "/ai",           label: "AI Assistant", icon: Bot },
  { href: "/settings",     label: "Settings",     icon: Settings },
] as const;

export function MobileNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Determine if current path is in menu items (not in primary nav)
  const isMenuActive =
    menuItems.some((item) => pathname === item.href || pathname.startsWith(item.href + "/")) &&
    !primaryNavItems.some((item) => pathname === item.href || pathname.startsWith(item.href + "/"));

  return (
    <>
      {/* ── Backdrop ───────────────────────────────────────────── */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* ── Menu sheet (slides up) ──────────────────────────────── */}
      <div
        className={cn(
          "fixed bottom-16 left-0 right-0 z-50 bg-card rounded-t-2xl border border-border shadow-xl transition-transform duration-300 ease-out md:hidden",
          menuOpen ? "translate-y-0" : "translate-y-full pointer-events-none"
        )}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <p className="text-sm font-semibold text-foreground">More</p>
          <button
            onClick={() => setMenuOpen(false)}
            className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground"
            aria-label="Close menu"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Grid of menu items */}
        <div className="grid grid-cols-3 gap-1 p-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1.5 rounded-xl p-3 transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="size-5 shrink-0" />
                <span className="text-[11px] font-medium leading-tight text-center">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Bottom navigation bar ──────────────────────────────── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-center justify-around h-16">
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <div className={cn(
                  "flex items-center justify-center rounded-xl px-5 py-1 transition-colors",
                  isActive ? "bg-primary/10" : ""
                )}>
                  <Icon className="size-5 shrink-0" />
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}

          {/* ── More / Menu button ── */}
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors",
              isMenuActive || menuOpen ? "text-primary" : "text-muted-foreground"
            )}
          >
            <div className={cn(
              "flex items-center justify-center rounded-xl px-5 py-1 transition-colors",
              isMenuActive || menuOpen ? "bg-primary/10" : ""
            )}>
              {menuOpen ? <X className="size-5 shrink-0" /> : <MoreHorizontal className="size-5 shrink-0" />}
            </div>
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>
    </>
  );
}

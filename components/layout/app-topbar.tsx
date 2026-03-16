"use client";

import { UserButton } from "@clerk/nextjs";
import { BranchSelector } from "@/components/layout/branch-selector";
import { Bell, Wrench } from "lucide-react";

type Branch = { id: string; name: string };

interface AppTopbarProps {
  branches: Branch[];
  selectedBranchId: string | null;
  isAdmin: boolean;
}

export function AppTopbar({ branches, selectedBranchId, isAdmin }: AppTopbarProps) {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-4 border-b border-border bg-card/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-card/80 shadow-sm">
      {/* Brand mark on mobile (hidden on desktop where sidebar shows it) */}
      <div className="flex items-center gap-2 md:hidden">
        <div className="flex size-7 items-center justify-center rounded-lg bg-primary">
          <Wrench className="size-4 text-primary-foreground" />
        </div>
        <span className="text-sm font-semibold text-foreground tracking-tight">Motor Auto Care</span>
      </div>

      {/* Branch selector — desktop shows in topbar */}
      <div className="hidden md:flex">
        <BranchSelector
          branches={branches}
          selectedBranchId={selectedBranchId}
          isAdmin={isAdmin}
        />
      </div>

      {/* Right side — branch selector on mobile + user button */}
      <div className="flex items-center gap-2 ml-auto">
        <div className="md:hidden">
          <BranchSelector
            branches={branches}
            selectedBranchId={selectedBranchId}
            isAdmin={isAdmin}
          />
        </div>
        <UserButton
          appearance={{
            elements: {
              avatarBox: "size-8",
            },
          }}
        />
      </div>
    </header>
  );
}

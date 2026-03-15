"use client";

import { UserButton } from "@clerk/nextjs";

export function AppTopbar() {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-end gap-2 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <UserButton afterSignOutUrl="/" />
    </header>
  );
}

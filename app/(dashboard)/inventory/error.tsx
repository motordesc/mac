"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PackageX } from "lucide-react";

export default function InventoryError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Inventory Error]", error);
  }, [error]);

  return (
    <div className="flex h-[50vh] flex-col items-center justify-center p-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400 mb-4">
        <PackageX className="size-7" />
      </div>
      <h2 className="mb-2 text-xl font-bold tracking-tight">Failed to Load Inventory</h2>
      <p className="mb-6 max-w-[400px] text-sm text-muted-foreground">
        We encountered an issue while loading the inventory data. Please try again.
      </p>
      
      {process.env.NODE_ENV === "development" && (
        <div className="mb-6 w-full max-w-[500px] overflow-auto rounded-lg bg-muted p-4 text-left text-xs font-mono text-muted-foreground">
          {error.message}
        </div>
      )}

      <Button onClick={() => reset()}>Try Again</Button>
    </div>
  );
}

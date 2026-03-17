"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Dashboard Error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Something went wrong</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          The dashboard encountered an error while rendering. This has been
          logged automatically.
        </p>
        {process.env.NODE_ENV === "development" && (
          <pre className="mt-2 max-w-lg overflow-auto rounded-lg bg-muted p-3 text-xs text-left">
            {error.message}
          </pre>
        )}
      </div>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}

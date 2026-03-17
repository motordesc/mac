"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function GlobalDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("[Global Layout Error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400 mb-6">
        <AlertTriangle className="size-7" />
      </div>
      <h2 className="mb-2 text-2xl font-bold tracking-tight">System Error</h2>
      <p className="mb-8 max-w-[500px] text-muted-foreground">
        We encountered an unexpected error while rendering this page layout. The issue has been automatically logged.
      </p>
      
      {process.env.NODE_ENV === "development" && (
        <div className="mb-8 w-full max-w-[600px] overflow-auto rounded-lg bg-muted p-4 text-left text-xs font-mono text-muted-foreground">
          {error.message}
        </div>
      )}

      <div className="flex gap-4">
        <Button variant="outline" onClick={() => window.location.href = "/"}>
          Return Home
        </Button>
        <Button onClick={() => reset()}>Try Again</Button>
      </div>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("[Main Layout Error]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400 mb-6">
        <AlertCircle className="size-8" />
      </div>
      <h1 className="mb-3 text-3xl font-bold tracking-tight">Application Error</h1>
      <p className="mb-8 max-w-[600px] text-muted-foreground">
        We encountered a critical error while loading the application. Our team has been notified.
      </p>
      
      {process.env.NODE_ENV === "development" && (
        <div className="mb-8 w-full max-w-[800px] overflow-auto rounded-lg bg-muted p-4 text-left text-sm font-mono text-muted-foreground">
          {error.message}
        </div>
      )}

      <div className="flex gap-4">
        <Button variant="outline" onClick={() => window.location.href = "/"}>
          Go to Homepage
        </Button>
        <Button onClick={() => reset()}>Try Again</Button>
      </div>
    </div>
  );
}

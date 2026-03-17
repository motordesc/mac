"use client";

/**
 * global-error.tsx
 *
 * Catches errors in the ROOT layout itself (including <html>/<body>).
 * Must render its own <html> and <body> tags because the root layout
 * may have crashed.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            padding: "2rem",
            textAlign: "center",
            backgroundColor: "#0a0a0a",
            color: "#fafafa",
          }}
        >
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            Something went wrong
          </h1>
          <p style={{ color: "#888", maxWidth: "28rem", marginBottom: "1.5rem" }}>
            A critical error occurred. Please try reloading the page.
            {error?.digest && (
              <span style={{ display: "block", marginTop: "0.5rem", fontSize: "0.75rem" }}>
                Error ID: {error.digest}
              </span>
            )}
          </p>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              onClick={() => (window.location.href = "/")}
              style={{
                padding: "0.5rem 1.25rem",
                borderRadius: "0.5rem",
                border: "1px solid #333",
                backgroundColor: "transparent",
                color: "#fafafa",
                cursor: "pointer",
                fontSize: "0.875rem",
              }}
            >
              Go Home
            </button>
            <button
              onClick={reset}
              style={{
                padding: "0.5rem 1.25rem",
                borderRadius: "0.5rem",
                border: "none",
                backgroundColor: "#fafafa",
                color: "#0a0a0a",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: 600,
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

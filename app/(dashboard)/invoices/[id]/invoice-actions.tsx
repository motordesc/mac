"use client";

import { Button } from "@/components/ui/button";
import { useTransition } from "react";
import { toast } from "sonner";

export function InvoiceActions({ invoiceId }: { invoiceId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDownloadPdf() {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/invoices/${invoiceId}/pdf`);
        if (!res.ok) throw new Error("Failed to generate PDF");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `invoice-${invoiceId}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("PDF downloaded");
      } catch (e) {
        toast.error("Could not download PDF");
      }
    });
  }

  return (
    <Button size="lg" onClick={handleDownloadPdf} disabled={isPending}>
      {isPending ? "Generating…" : "Download PDF"}
    </Button>
  );
}

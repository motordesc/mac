"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Download, Trash2 } from "lucide-react";

export function InvoiceActions({
  invoiceId,
  invoiceNumber,
}: {
  invoiceId: string;
  invoiceNumber: string;
}) {
  const [downloading, startDownload] = useTransition();
  const [deleting, startDelete] = useTransition();
  const router = useRouter();

  function handleDownloadPdf() {
    startDownload(async () => {
      try {
        const res = await fetch(`/api/invoices/${invoiceId}/pdf`);
        if (!res.ok) throw new Error("Failed to generate PDF");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `invoice-${invoiceNumber}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("PDF downloaded");
      } catch {
        toast.error("Could not download PDF");
      }
    });
  }

  function handleDelete() {
    if (!confirm(`Delete invoice ${invoiceNumber}? This cannot be undone.`)) return;
    startDelete(async () => {
      try {
        const res = await fetch(`/api/invoices/${invoiceId}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to delete invoice");
        toast.success("Invoice deleted");
        router.push("/invoices");
        router.refresh();
      } catch {
        toast.error("Could not delete invoice");
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Button onClick={handleDownloadPdf} disabled={downloading} size="sm" variant="outline">
        <Download className="mr-2 size-4" />
        {downloading ? "Generating…" : "PDF"}
      </Button>
      <Button
        onClick={handleDelete}
        disabled={deleting}
        size="sm"
        variant="destructive"
      >
        <Trash2 className="mr-2 size-4" />
        {deleting ? "Deleting…" : "Delete"}
      </Button>
    </div>
  );
}

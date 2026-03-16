"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Download, FileSpreadsheet } from "lucide-react";

type Branch = { id: string; name: string };

const REPORT_TYPES = [
  { value: "financial",  label: "Financial Report",  desc: "Revenue, expenses & payments" },
  { value: "inventory",  label: "Inventory Report",  desc: "Stock levels & low-stock items" },
  { value: "staff",      label: "Staff Report",      desc: "Staff list & job card counts" },
  { value: "jobcards",   label: "Job Cards Report",  desc: "All job cards with status" },
  { value: "customers",  label: "Customers Report",  desc: "Customer list & vehicle counts" },
  { value: "full",       label: "Full Report",       desc: "All sheets in one workbook" },
] as const;

export function ReportDownloads({
  branches,
  selectedBranchId,
}: {
  branches: Branch[];
  selectedBranchId: string | null;
}) {
  const [downloadingType, setDownloadingType] = useState<string | null>(null);
  const [targetBranch, setTargetBranch] = useState<string>(selectedBranchId ?? "__all__");

  async function handleDownload(type: string) {
    setDownloadingType(type);
    try {
      const params = new URLSearchParams({ type });
      if (targetBranch && targetBranch !== "__all__") {
        params.set("branchId", targetBranch);
      }
      const res = await fetch(`/api/export/excel?${params.toString()}`);
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const branchLabel = targetBranch !== "__all__"
        ? branches.find((b) => b.id === targetBranch)?.name ?? "branch"
        : "all-branches";
      a.download = `mac-${type}-${branchLabel}-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Report downloaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Download failed");
    } finally {
      setDownloadingType(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="size-5" />
          Download Reports
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Branch selector for download */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Download for:</span>
          <Select value={targetBranch} onValueChange={setTargetBranch}>
            <SelectTrigger className="w-48 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Branches</SelectItem>
              {branches.map((b: any) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Report grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {REPORT_TYPES.map((report: any) => (
            <div
              key={report.value}
              className="flex items-center justify-between rounded-lg border border-border p-3"
            >
              <div>
                <p className="text-sm font-medium">{report.label}</p>
                <p className="text-xs text-muted-foreground">{report.desc}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={downloadingType !== null}
                onClick={() => handleDownload(report.value)}
                className="ml-3 shrink-0"
              >
                {downloadingType === report.value ? (
                  <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Download className="size-3.5" />
                )}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

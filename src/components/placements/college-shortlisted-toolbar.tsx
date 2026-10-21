"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

/** Safe same-origin CSV export and refresh for the College Admin shortlist. */
export function CollegeShortlistedToolbar({ exportHref, cap }: {
  exportHref: string; cap: number;
}) {
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const [exporting, setExporting] = useState(false);
  const [notice, setNotice] = useState("");
  async function exportCsv() {
    if (exporting) return;
    setExporting(true);
    setNotice("");
    try {
      if (!exportHref.startsWith("/api/college/placements/jobs/")) {
        throw new Error("Invalid export URL");
      }
      const response = await fetch(exportHref, {credentials: "same-origin", cache: "no-store"});
      if (!response.ok) throw new Error("The shortlist could not be exported.");
      const blob = await response.blob();
      const href = URL.createObjectURL(blob);
      try {
        const anchor = document.createElement("a");
        anchor.href = href;
        anchor.download = "shortlisted-applications.csv";
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        setNotice("CSV export ready.");
      } finally {
        URL.revokeObjectURL(href);
      }
    } catch {
      setNotice("Export failed. Refresh the shortlist and try again.");
    } finally {
      setExporting(false);
    }
  }
  return <div className="flex min-w-0 flex-wrap items-center gap-3">
    <Button variant="secondary" type="button" disabled={refreshing}
      onClick={() => startRefresh(() => { setNotice(""); router.refresh(); })}>
      {refreshing ? "Refreshing…" : "Refresh"}
    </Button>
    <Button variant="secondary" type="button" disabled={exporting}
      onClick={() => void exportCsv()}>
      {exporting ? "Exporting…" : "Export CSV"}
    </Button>
    <p className="text-xs text-muted-foreground">Up to {cap.toLocaleString("en-IN")} rows</p>
    {notice ? <p role="status" className="w-full text-xs">{notice}</p> : null}
  </div>;
}

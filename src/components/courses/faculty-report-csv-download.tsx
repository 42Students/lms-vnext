"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  facultyReportCsv, facultyReportCsvFilename,
  type FacultyReportCsvInput,
} from "@/modules/courses/faculty-report-csv";

export function FacultyReportCsvDownload(props: FacultyReportCsvInput) {
  const [error, setError] = useState<string | null>(null);
  function download() {
    setError(null);
    try {
      const csv = facultyReportCsv(props);
      const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = facultyReportCsvFilename(props.kind,props.title,props.sectionName);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url),30_000);
    } catch {
      setError("Could not generate the authorized CSV. Please retry.");
    }
  }
  return <div className="flex flex-wrap items-center gap-3 print:hidden">
    <Button variant="secondary" onClick={download}>Download CSV</Button>
    {error ? <p role="alert" className="text-sm font-semibold text-error">{error}</p> : null}
  </div>;
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { buildFacultyReportPdf, type FacultyReportPdfInput } from "@/modules/courses/faculty-report-pdf";

type Props = Omit<FacultyReportPdfInput, "generatedAt">;

export function FacultyReportDownload(props: Props) {
  const [error, setError] = useState<string | null>(null);

  function download() {
    setError(null);
    try {
      // All private report data was resolved via server-side Faculty authorization.
      const pdf = buildFacultyReportPdf(props);
      const url = URL.createObjectURL(new Blob([pdf], { type: "application/pdf" }));
      const title = props.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70) || props.kind;
      const link = document.createElement("a");
      link.href = url;
      link.download = props.kind + "-report-" + title + ".pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch {
      setError(props.kind==="attendance"?"Couldn\'t generate the attendance report. Please try again.":"Could not generate the PDF. Please try again.");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 print:hidden">
      <Button variant="secondary" onClick={download}>{props.kind==="attendance"?"Download Report":"Download PDF"}</Button>
      {error ? <p role="alert" className="text-sm font-semibold text-error">{error}</p> : null}
    </div>
  );
}

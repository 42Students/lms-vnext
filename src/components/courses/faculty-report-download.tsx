"use client";
import { Alert } from "@/components/ui/alert";


import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { buildFacultyReportPdf, type FacultyReportPdfInput } from "@/modules/courses/faculty-report-pdf";

type Props = Omit<FacultyReportPdfInput, "generatedAt"> & { incomplete?: boolean };

export function FacultyReportDownload(props: Props) {
  const [error, setError] = useState<string | null>(null);
  const [confirmationOpen,setConfirmationOpen]=useState(false);

  function downloadPdf() {
    setError(null);
    try {
      // All private report data was resolved via server-side Faculty authorization.
      const {incomplete,...reportData}=props;
      const pdf = buildFacultyReportPdf({
        ...reportData,
        summary:incomplete?["This report is incomplete",...reportData.summary]:reportData.summary,
      });
      let url: string | null = null;
      let link: HTMLAnchorElement | null = null;
      try {
        url = URL.createObjectURL(new Blob([pdf], { type: "application/pdf" }));
        const title = props.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70) || props.kind;
        link = document.createElement("a");
        link.href = url;
        link.download = props.kind + "-report-" + title + ".pdf";
        document.body.appendChild(link);
        link.click();
        // Keep the object URL available until the browser has accepted the handoff.
        const pendingUrl = url;
        window.setTimeout(() => URL.revokeObjectURL(pendingUrl), 30_000);
        url = null;
      } finally {
        link?.remove();
        if (url !== null) {
          try { URL.revokeObjectURL(url); } catch { /* best effort on failed download */ }
        }
      }
    } catch {
      setError(props.kind==="attendance"?"Couldn\'t generate the attendance report. Please try again.":"Could not generate the PDF. Please try again.");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 print:hidden">
      <Button type="button" variant="secondary" aria-haspopup={props.incomplete?"dialog":undefined} className="min-h-11 md:min-h-[var(--lms-control-height)]" onClick={()=>{
        if(props.incomplete){setError(null);setConfirmationOpen(true);}else downloadPdf();
      }}>{props.kind==="attendance"?"Download Report":"Download PDF"}</Button>
      <ConfirmDialog open={confirmationOpen} onOpenChange={setConfirmationOpen}
        title="This report is incomplete"
        description="Some learners have not submitted or some submitted assignments have not been graded. The PDF will be marked incomplete."
        confirmLabel="Download marked incomplete" confirmVariant="primary"
        onConfirm={()=>{setConfirmationOpen(false);downloadPdf();}}/>
      {error ? <Alert tone="error">{error}</Alert> : null}
    </div>
  );
}

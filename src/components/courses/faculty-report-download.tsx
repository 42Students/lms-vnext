"use client";
import { Alert } from "@/components/ui/alert";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { buildFacultyReportPdf, type FacultyReportPdfInput } from "@/modules/courses/faculty-report-pdf";

/** An incomplete learner workflow (ungraded or unsubmitted work) is NOT an
 * unavailable roster. Only an explicit failed/partial roster read authorizes
 * a data-integrity confirmation. The page that loads the roster owns that
 * distinction and must not pass rosterUnavailable for ordinary in-progress work.
 */
type Props = Omit<FacultyReportPdfInput, "generatedAt"> & {
  incomplete?: boolean;
  rosterUnavailable?: boolean;
  rosterWarning?: string;
};

export function FacultyReportDownload(props: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [confirmationOpen,setConfirmationOpen]=useState(false);
  const locked=useRef(false);
  const {showToast}=useToast();

  async function downloadPdf() {
    if(locked.current)return;
    locked.current=true;
    setError(null);
    setPending(true);
    try {
      // Allow the pending button affordance to paint before synchronous
      // PDF serialization; generation remains on the user's own click.
      await new Promise<void>(resolve=>window.setTimeout(resolve,0));
      // All private report data was resolved via server-side Faculty authorization.
      const pdf = buildFacultyReportPdf({
        kind:props.kind,title:props.title,subtitle:props.subtitle,
        sections:props.sections,
        summary:props.rosterUnavailable
          ? ["This report is incomplete",...props.summary]
          : props.summary,
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
      const message=props.kind==="attendance"
        ? "Couldn't generate the attendance report. Please try again."
        : "Couldn't generate the PDF. Please try again.";
      setError(message);
      showToast({tone:"error",title:message});
    } finally {
      locked.current=false;
      setPending(false);
    }
  }

  return (
    <div className="min-w-0 space-y-2 print:hidden">
      <Button type="button" variant="primary"
        aria-haspopup={props.rosterUnavailable?"dialog":undefined}
        loading={pending} disabled={pending}
        className="min-h-11 w-full sm:w-auto md:min-h-[var(--lms-control-height)]"
        onClick={()=>{
          if(props.rosterUnavailable){setError(null);setConfirmationOpen(true);}
          else void downloadPdf();
        }}>{pending?"Generating PDF…":props.kind==="attendance"?"Download Report":"Download PDF"}</Button>
      {props.incomplete && !props.rosterUnavailable ? <p role="status"
        className="text-xs leading-5 text-muted-foreground">
        Some learner work is not submitted or graded yet. This does not mean the roster failed to load.
      </p> : null}
      <ConfirmDialog open={confirmationOpen}
        onOpenChange={next=>{if(!pending)setConfirmationOpen(next);}}
        title="This report is incomplete"
        description={props.rosterWarning ||
          "The complete class roster could not be loaded. Downloading now may omit learners from this report."}
        confirmLabel="Download marked incomplete" confirmVariant="primary"
        pending={pending}
        onConfirm={()=>{setConfirmationOpen(false);void downloadPdf();}}/>
      {error ? <Alert tone="error">{error}</Alert> : null}
    </div>
  );
}

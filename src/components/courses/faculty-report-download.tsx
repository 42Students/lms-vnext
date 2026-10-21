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
  /** Explicit India month from the attendance month picker, YYYY-MM. */
  attendanceMonth?: string;
  /** Authorized course label, used for the historic attendance filename. */
  attendanceCourse?: string;
  incomplete?: boolean;
  rosterUnavailable?: boolean;
  rosterWarning?: string;
};

function reportFileName(props:Props){
 const safe=(value:string)=>value.replace(/[^a-z0-9]+/gi,"-")||props.kind;
 if(props.kind==="attendance"){
  // The legacy attendance filename was attendance-course-MMMM-YYYY.pdf.
  // Never use browser-local dates or generated-at (which may be another month).
  const fallbackMonth=props.title.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b/i);
  const explicit=props.attendanceMonth?.match(/^(\d{4})-(0[1-9]|1[0-2])$/);
  const monthName=explicit?new Intl.DateTimeFormat("en-US",{month:"long",timeZone:"UTC"}).format(
    new Date(Date.UTC(Number(explicit[1]),Number(explicit[2])-1,1))):
    fallbackMonth?.[1]??"Unknown";
  const year=explicit?.[1]??fallbackMonth?.[2]??"Unknown";
  const course=props.attendanceCourse??(fallbackMonth?props.title.slice(0,fallbackMonth.index).trim():props.title);
  return "attendance-"+safe(course)+"-"+monthName+"-"+year+".pdf";
 }
 // Old jsPDF filenames preserve case and trailing dashes produced by
 // normalizing punctuation; do not silently lowercase, trim, or truncate.
 return props.kind+"-report-"+safe(props.title)+".pdf";
}

function DownloadGlyph(){
 return <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="16" height="16"
  fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
  <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 16v4h16v-4"/>
 </svg>;
}

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
      const missingReason=props.rosterWarning?.trim()||
       "The complete class roster could not be loaded.";
      const pdf=buildFacultyReportPdf({
        kind:props.kind,title:props.title,subtitle:props.subtitle,
        // A visually prominent first section and summary preserve the audit
        // warning in the exported bytes, not just the confirmation dialog.
        sections:props.rosterUnavailable?
         [{title:"INCOMPLETE DATA",rows:[missingReason]},...props.sections]:
         props.sections,
        summary:props.rosterUnavailable?
         ["INCOMPLETE DATA: "+missingReason,...props.summary]:props.summary,
        generatedAt:new Date(),
      });
      let url: string | null = null;
      let link: HTMLAnchorElement | null = null;
      try {
        url = URL.createObjectURL(new Blob([pdf], { type: "application/pdf" }));
        link=document.createElement("a");
        link.href=url;
        link.download=reportFileName(props);
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
          if(locked.current)return;
          if(props.rosterUnavailable){setError(null);setConfirmationOpen(true);}
          else void downloadPdf();
        }}>
        <span className="inline-flex items-center justify-center gap-2"><DownloadGlyph/>
         {pending?"Generating PDF…":props.kind==="attendance"?"Download Report":"Download PDF"}
        </span>
      </Button>
      {props.incomplete && !props.rosterUnavailable ? <p role="status"
        className="text-xs leading-5 text-muted-foreground">
        Some learner work is not submitted or graded yet. This does not mean the roster failed to load.
      </p> : null}
      <ConfirmDialog open={confirmationOpen}
        onOpenChange={next=>{if(!pending)setConfirmationOpen(next);}}
        title="This report is incomplete"
        description={(props.rosterWarning?.trim()||
          "The complete class roster could not be loaded.")+
          " The PDF will be marked as incomplete. Download anyway?"}
        confirmLabel="Download marked incomplete" cancelLabel="Cancel" confirmVariant="primary"
        pending={pending}
        onConfirm={()=>{setConfirmationOpen(false);void downloadPdf();}}/>
      {error ? <Alert tone="error">{error}</Alert> : null}
    </div>
  );
}

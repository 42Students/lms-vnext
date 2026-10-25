"use client";
import {Button} from "@/components/ui/button";
import {RecruiterResumesZipDownload} from "@/components/placements/recruiter-resumes-zip-download";
/** Print exactly the already authorized booked panel list presented on the page.
 * Resumes remain a separate capped, per-file authorized download. */
export function RecruiterPanelActions({jobId}:{jobId:string}){
 return <div className="flex flex-wrap items-start gap-3">
  <Button type="button" variant="secondary" className="min-h-11 md:min-h-9"
   onClick={()=>window.print()}>
   Print panel lists
  </Button>
  <RecruiterResumesZipDownload jobId={jobId}/>
 </div>;
}

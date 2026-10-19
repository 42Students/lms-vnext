"use client";
import { Button } from "@/components/ui/button";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {roundApplyPreviewCsv,roundApplyReportCsv} from "@/modules/placements/tpo-round-apply-csv-model";
type Preview={ready:boolean;roundName?:string;staged:number;applied:number;
 outcomes:{PASS:number;FAIL:number;HOLD:number;ABSENT:number};destinations:{PASS:string;FAIL:string;HOLD:string;ABSENT:string};previewToken:string;
 rows:Array<{resultId:string;student:string;outcome:string;status:string;destination:string}>;
 skippedUnrecordedNote:string};
type ApplyReport={applied:number;skipped:number;unchanged:number;
 results:Array<{resultId:string;student:string;outcome:string;status:string;reason?:string}>};
function downloadRoundCsv(csv:string,name:string){
 const url=URL.createObjectURL(new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"}));
 const link=document.createElement("a");link.href=url;link.download=name;link.click();
 URL.revokeObjectURL(url);
}
export function TpoRoundApplyControl({jobId,roundId}:{jobId:string;roundId:string}){
 const router=useRouter();const [preview,setPreview]=useState<Preview|null>(null);
 const [report,setReport]=useState<ApplyReport|null>(null);const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const url="/api/placements/tpo/jobs/"+encodeURIComponent(jobId)+"/rounds/"+encodeURIComponent(roundId)+"/apply-all";
 async function load(){
  setBusy(true);setError("");setReport(null);
  try{const res=await fetch(url,{credentials:"same-origin",cache:"no-store"});
   const value=await res.json() as Preview&{error?:string};
   if(!res.ok)throw Error("Could not load round preview");
   setPreview(value);
  }catch(e){setError(e instanceof Error?e.message:"Could not preview results");}finally{setBusy(false);}
 }
 async function apply(){
  if(!preview||!preview.ready||!preview.staged||busy)return;
  setBusy(true);setError("");
  try{const res=await fetch(url,{method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},
   body:JSON.stringify({confirmed:true,expectedPreviewToken:preview.previewToken})});
   const value=await res.json() as ApplyReport&{error?:string};
   if(!res.ok)throw Error("Results could not be applied");
   setReport(value);setPreview(null);router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Results could not be applied");}finally{setBusy(false);}
 }
 return <section className="space-y-3 border-b border-border pb-6">
  <h2 className="font-semibold text-foreground">Apply results for the whole round</h2>
  <p className="text-sm text-body">Preview who passes, is not cleared, is waitlisted or marked absent, then confirm the full round in one step. Applied results cannot be edited.</p>
  <Button variant="secondary" type="button" disabled={busy} onClick={()=>void load()}
   >
   {busy?"Working…":"Preview applying round results"}</Button>
  {preview?<div role="region" aria-label="Round application preview" className="space-y-3 rounded-[var(--lms-canvas-radius)] border border-border bg-muted p-4">
   <h3 className="font-semibold">Consequence preview</h3>
   <p className="text-sm">{preview.staged} staged results to apply; {preview.applied} already applied (unchanged).</p>
   <dl className="grid grid-cols-2 overflow-hidden rounded-[var(--lms-canvas-radius)] border border-border bg-surface text-sm sm:grid-cols-4">
    <div className="border-b border-border p-3 sm:border-r sm:border-b-0"><dt>Cleared → {preview.destinations.PASS}</dt><dd className="font-semibold">{preview.outcomes.PASS}</dd></div>
    <div className="border-b border-border p-3 sm:border-r sm:border-b-0"><dt>Not cleared</dt><dd className="font-semibold">{preview.outcomes.FAIL}</dd></div>
    <div className="border-b border-border p-3 sm:border-r sm:border-b-0"><dt>Waitlisted</dt><dd className="font-semibold">{preview.outcomes.HOLD}</dd></div>
    <div className="p-3"><dt>Absent</dt><dd className="font-semibold">{preview.outcomes.ABSENT}</dd></div>
   </dl>
   <div className="max-h-60 overflow-y-auto rounded-[var(--lms-control-radius)] border border-border px-2">
    {preview.rows.map(r=><div key={r.resultId} className="flex justify-between gap-2 border-b border-border px-2 py-2 text-sm last:border-b-0">
     <span>{r.student}</span><span>{r.outcome} → {r.destination} · {r.status}</span>
    </div>)}
   </div>
   <p className="text-xs text-body">{preview.skippedUnrecordedNote}</p>
   <Button variant="secondary" type="button" onClick={()=>downloadRoundCsv(
    roundApplyPreviewCsv(preview.rows),"round-"+roundId+"-apply-preview.csv")}
    >
    Export consequence preview (CSV)
   </Button>
   {!preview.ready?<p role="alert" className="text-sm text-foreground">Complete this evaluation round before applying results.</p>:null}
   <div className="flex flex-wrap gap-3">
    <Button variant="primary" type="button" disabled={busy||!preview.ready||!preview.staged} onClick={()=>void apply()}
     className="min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] bg-primary px-4 text-sm font-semibold disabled:opacity-50 text-primary-foreground">
     Confirm and apply {preview.staged} result(s)</Button>
    <Button variant="secondary" type="button" disabled={busy} onClick={()=>setPreview(null)}
     >Not yet</Button>
   </div>
  </div>:null}
  {report?<div role="status" className="space-y-2 text-sm">
   <p className="font-semibold">{report.applied} applied · {report.skipped} skipped · {report.unchanged} already applied.</p>
   <div className="max-h-44 overflow-y-auto">{report.results.map(x=><p key={x.resultId}>
    {x.student}: {x.status} ({x.outcome}) {x.reason?"· "+x.reason:""}
   </p>)}</div>
   <Button variant="secondary" type="button" className="mr-3"
    onClick={()=>downloadRoundCsv(roundApplyReportCsv(report.results),"round-"+roundId+"-apply-results.csv")}>
    Export results (CSV)
   </Button>
   <Button variant="secondary" type="button" onClick={()=>{if(!navigator.clipboard){setError("Clipboard is unavailable. Use Export results (CSV).");return;}void navigator.clipboard.writeText(
    ["Learner\tResult state\tOutcome\tReason",...report.results.map(x=>[x.student,x.status,x.outcome,x.reason??""].map(value=>value.replaceAll("\t"," ").replaceAll("\n"," ")).join("\t"))].join("\n")
   ).catch(()=>setError("Copy failed. Use Export results (CSV)."));}}>Copy results</Button>
  </div>:null}
  {error?<p role="alert" className="text-sm text-foreground">{error} Refresh the preview before retrying.</p>:null}
 </section>;
}

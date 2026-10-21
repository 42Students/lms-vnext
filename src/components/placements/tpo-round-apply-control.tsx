"use client";
import { Button } from "@/components/ui/button";
import {Alert} from "@/components/ui/alert";
import {InlineNotice} from "@/components/ui/inline-notice";
import {Dialog} from "@/components/ui/dialog";
import {useToast} from "@/components/ui/toast";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {roundApplyReportCsv} from "@/modules/placements/tpo-round-apply-csv-model";
type Preview={ready:boolean;roundName?:string;staged:number;applied:number;
 outcomes:{PASS:number;FAIL:number;HOLD:number;ABSENT:number};destinations:{PASS:string;FAIL:string;HOLD:string;ABSENT:string};previewToken:string;
 rows:Array<{resultId:string;student:string;outcome:string;status:string;destination:string;rollNumber?:string|null;enteredBy?:string|null;reason?:string|null}>;
 skippedUnrecordedNote:string};
type ApplyReport={applied:number;skipped:number;unchanged:number;
 results:Array<{resultId:string;student:string;outcome:string;status:string;reason?:string}>};
function downloadRoundCsv(csv:string,name:string){
 const url=URL.createObjectURL(new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"}));
 const link=document.createElement("a");link.href=url;link.download=name;link.click();
 URL.revokeObjectURL(url);
}
/** Legacy five-column CSV. Never allow spreadsheet formulas to execute. */
function previewCsv(rows:Preview["rows"]){
 const cell=(v:unknown)=>{
  const raw=String(v??"");
  const safe=/^[\s]*[=+@-]/.test(raw)?"'"+raw:raw;
  return '"'+safe.replaceAll('"','""')+'"';
 };
 return [["Student","Roll","Result","Entered by","Reason"],...rows.map(r=>[
  r.student,r.rollNumber??"Not recorded",r.outcome,
  r.enteredBy??"Not recorded",r.reason??"Not recorded",
 ])].map(row=>row.map(cell).join(",")).join("\r\n")+"\r\n";
}
export function TpoRoundApplyControl({jobId,roundId}:{jobId:string;roundId:string}){
 const router=useRouter();const {showToast}=useToast();const [preview,setPreview]=useState<Preview|null>(null);
 const [report,setReport]=useState<ApplyReport|null>(null);const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");const [showSkipped,setShowSkipped]=useState(false);
 const [previewSearch,setPreviewSearch]=useState("");
 const url="/api/placements/tpo/jobs/"+encodeURIComponent(jobId)+"/rounds/"+encodeURIComponent(roundId)+"/apply-all";
 async function load(){
  setBusy(true);setError("");setReport(null);
  try{const res=await fetch(url,{credentials:"same-origin",cache:"no-store"});
   const value=await res.json() as Preview&{error?:string};
   if(!res.ok)throw Error("Could not load the pending results. Retry before applying them.");
   setPreviewSearch("");setPreview(value);
  }catch{
   setPreview(null);
   setError("Could not load the pending results. Retry before applying them.");
  }finally{setBusy(false);}
 }
 async function apply(){
  if(!preview||!preview.ready||!preview.staged||busy)return;
  setBusy(true);setError("");
  try{const res=await fetch(url,{method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},
   body:JSON.stringify({confirmed:true,expectedPreviewToken:preview.previewToken})});
   const value=await res.json() as ApplyReport&{error?:string};
   if(!res.ok)throw Error("Results could not be applied");
   setReport(value);setPreview(null);
   if(value.skipped>0)setShowSkipped(true);
   else showToast({tone:"success",title:"Results applied and students notified"});
   if(value.unchanged>0)showToast({tone:"info",
    title:value.unchanged+" student"+(value.unchanged===1?"":"s")+" kept their stage",
    description:"Already applied results do not change a student\u0027s current stage."});
   router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Results could not be applied");}finally{setBusy(false);}
 }
 return <section className="space-y-3 border-b border-border pb-6">
  <h2 className="font-semibold text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px] text-[var(--lms-heading)]">Apply round results</h2>
  <p className="text-sm text-body leading-[22px]">Preview who passes, is not cleared, is waitlisted or marked absent, then confirm the full round in one step. Applied results cannot be edited.</p>
  <Button variant="secondary" type="button" disabled={busy} onClick={()=>void load()}
   >
   {busy?"Working…":"Review and apply round results"}</Button>
  {preview?<Dialog open={true} onOpenChange={open=>{if(!open&&!busy)setPreview(null);}}
    title={"Apply "+(preview.roundName??"round")+" results"}
    description="Review results before notifying learners." className="!max-w-[900px]">
   <div role="region" aria-label="Round application preview" className="space-y-3">
   <h3 className="font-semibold">Consequence preview</h3>
   <p className="text-sm leading-[22px]">{preview.staged} staged results to apply; {preview.applied} already applied (unchanged).</p>
   <dl className="grid grid-cols-2 overflow-hidden rounded-[var(--lms-canvas-radius)] border border-border bg-surface text-sm sm:grid-cols-4">
    <div className="border-b border-border p-3 sm:border-r sm:border-b-0"><dt>Cleared → {preview.destinations.PASS}</dt><dd className="font-semibold">{preview.outcomes.PASS}</dd></div>
    <div className="border-b border-border p-3 sm:border-r sm:border-b-0"><dt>Not cleared</dt><dd className="font-semibold">{preview.outcomes.FAIL}</dd></div>
    <div className="border-b border-border p-3 sm:border-r sm:border-b-0"><dt>Waitlisted</dt><dd className="font-semibold">{preview.outcomes.HOLD}</dd></div>
    <div className="p-3"><dt>Absent</dt><dd className="font-semibold">{preview.outcomes.ABSENT}</dd></div>
   </dl>
   <label className="grid gap-1 text-sm font-semibold">Search student or results
    <input type="search" value={previewSearch} onChange={event=>setPreviewSearch(event.target.value)}
     placeholder="Student, roll or reason" className="min-h-11 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 font-normal md:min-h-9"/>
   </label>
   <div className="max-h-[360px] overflow-auto rounded-[var(--lms-control-radius)] border border-border">
    <table className="w-full min-w-[680px] border-collapse text-left text-sm">
     <thead className="sticky top-0 bg-surface-subtle"><tr>
      {["Student","Roll","Result","Entered by","Reason"].map(label=>
       <th key={label} scope="col" className="border-b border-border px-3 py-2 font-semibold">{label}</th>)}
     </tr></thead>
     <tbody>{preview.rows.filter(r=>
      [r.student,r.rollNumber??"",r.outcome,r.enteredBy??"",r.reason??""]
       .some(value=>value.toLowerCase().includes(previewSearch.trim().toLowerCase()))).map(r=>
      <tr key={r.resultId} className="border-b border-border last:border-0">
       <td className="px-3 py-2">{r.student}</td>
       <td className="px-3 py-2">{r.rollNumber??"Not recorded"}</td>
       <td className="px-3 py-2">{r.outcome} → {r.destination}</td>
       <td className="px-3 py-2">{r.enteredBy??"Not recorded"}</td>
       <td className="px-3 py-2">{r.reason??"Not recorded"}</td>
      </tr>)}</tbody>
    </table>
   </div>
   <p className="text-xs text-body leading-[20px]">{preview.skippedUnrecordedNote}</p>
   <Button variant="secondary" type="button" onClick={()=>downloadRoundCsv(
    previewCsv(preview.rows),"round-"+roundId+"-apply-preview.csv")}
    >
    Export consequence preview (CSV)
   </Button>
   <p className="text-sm font-semibold text-warning-text">This is not an undo. Applied results cannot be edited.</p>
   {!preview.ready?<Alert tone="warning">Complete this evaluation round before applying results.</Alert>:null}
   <div className="flex flex-wrap gap-3">
    <Button variant="primary" type="button" disabled={busy||!preview.ready||!preview.staged} onClick={()=>void apply()}
     className="min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] bg-primary px-4 text-sm font-[650] disabled:opacity-50 text-primary-foreground">
     Apply and notify ({preview.staged})</Button>
    <Button variant="secondary" type="button" disabled={busy} onClick={()=>setPreview(null)}
     >Cancel</Button>
   </div>
  </div></Dialog>:null}
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
  <Dialog open={showSkipped} onOpenChange={setShowSkipped} role="alertdialog"
   title={(report?.applied??0)+" result"+(report?.applied===1?"":"s")+" applied, "+
    (report?.skipped??0)+" result"+(report?.skipped===1?"":"s")+" not"}
   description="Some results could not be applied. They remain pending for review."
   footer={<Button type="button" onClick={()=>setShowSkipped(false)}>OK</Button>}>
   <ul className="space-y-2 text-sm">
    {report?.results.filter(row=>row.status==="skipped").map(row=><li key={row.resultId}>
     <strong>{row.student}</strong>: {row.reason||"Result was not applied. Refresh this round and try again."}
    </li>)}
   </ul>
  </Dialog>
  {error?<div className="space-y-2">
   <InlineNotice tone="error" message={error==="Could not load the pending results. Retry before applying them."?error:error+" Refresh the preview before retrying."}/>
   {error==="Could not load the pending results. Retry before applying them."?
    <Button type="button" variant="secondary" disabled={busy} onClick={()=>void load()}>Retry loading pending results</Button>:null}
  </div>:null}
 </section>;
}

"use client";
import { Checkbox } from "@/components/ui/checkbox";
import { Radio } from "@/components/ui/radio";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
type Match={line:number;identity:string;applicationId:string;name:string;outcome:string;status:string|null};
type Missing={line:number;identity:string;reason:string;suggestions:Array<{applicationId:string;name:string;roll:string|null}>};
type Preview={previewToken:string;sourceRows:number;candidateCount:number;matched:Match[];
 unmatched:Missing[];notInFile:Array<{applicationId:string;name:string}>};
type Report={staged:number;skipped:number;unmatched:number;results:Array<{line:number;applicationId:string;status:string;reason?:string}>};
export function TpoRoundResultsImport({jobId,roundId}:{jobId:string;roundId:string}){
 const router=useRouter();const [file,setFile]=useState<File|null>(null);
 const [preview,setPreview]=useState<Preview|null>(null);const [report,setReport]=useState<Report|null>(null);
 const [overrides,setOverrides]=useState<Record<number,string>>({});
 const [skips,setSkips]=useState<number[]>([]);
 const [missingPolicy,setMissingPolicy]=useState<"LEAVE_PENDING"|"MARK_NOT_CLEARED">("LEAVE_PENDING");
 const [confirmMissingFailure,setConfirmMissingFailure]=useState(false);
 const [busy,setBusy]=useState(false);const [error,setError]=useState("");
 const [confirmOpen,setConfirmOpen]=useState(false);
 const url="/api/placements/tpo/jobs/"+encodeURIComponent(jobId)+"/rounds/"+encodeURIComponent(roundId)+"/import-results";
 async function send(action:"PREVIEW"|"STAGE_IMPORT"){
  if(!file||busy)return;
  setBusy(true);setError("");
  try{
   const payload=new FormData();
   payload.set("file",file);payload.set("action",action);
   if(action==="STAGE_IMPORT"){
    if(!preview)throw Error("Preview the file before confirming.");
    // These flags are sent only from the explicit review confirmation flow.
    payload.set("confirmed","true");
    if(missingPolicy==="MARK_NOT_CLEARED"&&confirmMissingFailure)
     payload.set("confirmMissingFailure","true");
    payload.set("previewToken",preview.previewToken);
    payload.set("missingPolicy",missingPolicy);
    payload.set("overrides",JSON.stringify(Object.entries(overrides).filter(([,id])=>Boolean(id))
     .map(([line,applicationId])=>({line:Number(line),applicationId}))));
    payload.set("skippedLines",JSON.stringify(skips));
   }
   const response=await fetch(url,{method:"POST",credentials:"same-origin",body:payload});
   const result=await response.json() as (Preview&Report&{message?:string});
   // The server's sanitized message is the only error text allowed in UI.
   // Raw error codes, database details and arbitrary validation internals
   // are not safe to echo to the person staging a company's results.
   if(!response.ok)throw Error(typeof result.message==="string"&&result.message.length<=300?
    result.message:"Import failed. Review the file and try again.");
   if(action==="PREVIEW"){setPreview(result);setReport(null);setOverrides({});setSkips([]);setConfirmMissingFailure(false);}
   else {setReport(result);setPreview(null);router.refresh();}
  }catch(e){setError(e instanceof Error?e.message:"Import failed");}
  finally{setBusy(false);}
 }
 return <section className="space-y-4 border-b border-border pb-6">
  <h2 className="text-lg font-semibold text-foreground">Import company round results</h2>
  <p className="text-sm text-body">Upload a CSV or Excel (.xlsx) result list. All supplied Application ID, email and roll identifiers must agree.
   Company portal IDs with no matching application are left unmatched. Contradictory IDs, email and roll must be reviewed; a manual match is audited. Nothing is applied to the round until the separate Apply results step.</p>
  <a href={url} download className="inline-flex min-h-11 md:min-h-9 items-center text-sm font-semibold text-[var(--lms-teal-deep)] underline">Download CSV template</a>
  <label className="block text-sm font-semibold text-body">Company results file
   <Input type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    disabled={busy} onChange={e=>{setFile(e.target.files?.[0]??null);setPreview(null);setReport(null);setOverrides({});setSkips([]);setMissingPolicy("LEAVE_PENDING");setConfirmMissingFailure(false);}}
    className="mt-2 block min-h-11 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface p-3 text-foreground md:min-h-9"/>
  </label>
  <Button variant="secondary" type="button" disabled={busy||!file} onClick={()=>void send("PREVIEW")}
   className="min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] border border-primary px-4 text-sm font-semibold text-[var(--lms-teal-deep)] disabled:opacity-50">
   {busy?"Checking…":"Preview matching results"}</Button>
  {preview?<div className="space-y-4 rounded-[var(--lms-canvas-radius)] border border-border bg-muted p-4">
   <h3 className="font-semibold">Import preview</h3>
   <p role="status" className="text-sm">{preview.sourceRows} source rows · {preview.matched.length} matched · {preview.unmatched.length} unmatched · {preview.notInFile.length} not in file</p>
   <div tabIndex={0} role="group" aria-label="Imported round preview, scroll for more rows" className="max-h-44 min-h-0 overflow-auto overscroll-contain rounded-[var(--lms-control-radius)] border border-border p-2 [mask-image:linear-gradient(to_bottom,black_0%,black_88%,transparent_100%)]">
    {preview.matched.map(row=><p key={row.line} className="border-b border-border px-2 py-2 text-sm last:border-b-0">
     Row {row.line}: {row.name} · {row.outcome} {row.status?"· existing "+row.status:""}</p>)}
   </div>
   {preview.unmatched.length?<div className="space-y-2">
    <h4 className="font-semibold">Unmatched rows — review or skip</h4>
    {preview.unmatched.map(row=><div key={row.line} className="grid gap-2 border-b border-border py-3 sm:grid-cols-2">
     <p className="text-sm">Row {row.line}: {row.identity||"No ID"} · {row.reason}</p>
     <div className="flex flex-wrap gap-2">
      <Select aria-label={"Match row "+row.line} className="min-h-11 md:min-h-9 flex-1 rounded-[var(--lms-control-radius)] border border-border bg-surface p-2 text-sm"
       value={overrides[row.line]??""} disabled={busy} onChange={e=>{setOverrides(p=>({...p,[row.line]:e.target.value}));if(e.target.value)setSkips(p=>p.filter(n=>n!==row.line));}}>
       <option value="">Do not match this row</option>
       {row.suggestions.map(s=><option key={s.applicationId} value={s.applicationId}>{s.name}{s.roll?" · "+s.roll:""}</option>)}
      </Select>
      <label className="flex items-center gap-2 text-sm">
       <Checkbox checked={skips.includes(row.line)} disabled={busy}
        onChange={e=>{setSkips(p=>e.target.checked?[...p,row.line]:p.filter(n=>n!==row.line));if(e.target.checked)setOverrides(p=>({...p,[row.line]:""}));}}/> Skip row
      </label>
     </div>
    </div>)}
   </div>:null}
   <details className="rounded-[var(--lms-control-radius)] border border-border bg-surface p-3 text-sm">
    <summary className="cursor-pointer font-semibold">Not in file ({preview.notInFile.length})</summary>
    {preview.notInFile.length?<ul tabIndex={0} aria-label="Learners not in import file, scroll for more" className="mt-2 max-h-48 min-h-0 space-y-1 overflow-auto overscroll-contain [mask-image:linear-gradient(to_bottom,black_0%,black_88%,transparent_100%)]">
     {preview.notInFile.map(row=><li key={row.applicationId} className="border-b border-border py-1">
      {row.name} · <span className="font-mono text-xs">{row.applicationId}</span>
     </li>)}
    </ul>:<p className="mt-2">Every candidate in this round is represented in the file.</p>}
   </details>
   <fieldset className="space-y-2 rounded-[var(--lms-control-radius)] border border-border bg-surface p-3 text-sm">
    <legend className="font-semibold">Students not in the file</legend>
    <label className="flex gap-2"><Radio checked={missingPolicy==="LEAVE_PENDING"}
     onChange={()=>{setMissingPolicy("LEAVE_PENDING");setConfirmMissingFailure(false);}}/> Leave pending (do not change their result)</label>
    <label className="flex gap-2"><Radio checked={missingPolicy==="MARK_NOT_CLEARED"}
     onChange={()=>setMissingPolicy("MARK_NOT_CLEARED")}/> Mark everyone missing as Not cleared</label>
    {missingPolicy==="MARK_NOT_CLEARED"?<div className="space-y-2 text-foreground">
     <p>This also stages Not cleared for {preview.notInFile.length} currently eligible applicants missing from the file. Unmatched source rows must be resolved. Students are not told until results are applied.</p>
     <label className="flex items-center gap-2 text-sm font-semibold">
      <Checkbox checked={confirmMissingFailure} onChange={e=>setConfirmMissingFailure(e.target.checked)}/>
      I reviewed the missing students and choose to stage Not cleared.
     </label>
    </div>:null}
   </fieldset>
   <Button variant="primary" type="button" disabled={busy||(missingPolicy==="MARK_NOT_CLEARED"&&!confirmMissingFailure)||
    (!preview.matched.length&&missingPolicy==="LEAVE_PENDING"&&!Object.values(overrides).some(Boolean))} onClick={()=>setConfirmOpen(true)}
    className="min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] bg-primary px-4 text-sm font-semibold disabled:opacity-50 text-primary-foreground">
    {busy?"Staging…":"Confirm and stage results"}</Button>
  </div>:null}
  <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen} pending={busy}
    title="Stage this reviewed result import?"
    description={(missingPolicy==="MARK_NOT_CLEARED"?"Applicants not in the file will be marked Not cleared. ":"")+"Results are not published until the separate Apply step."}
    confirmLabel="Confirm and stage results"
    onConfirm={()=>{setConfirmOpen(false);void send("STAGE_IMPORT");}}/>
  {report?<div role="status" className="space-y-2 rounded-[var(--lms-control-radius)] border border-border p-4 text-sm">
   <p className="font-semibold">{report.staged} results staged · {report.skipped} skipped · {report.unmatched} unmatched.</p>
   <div tabIndex={0} role="group" aria-label="Round import outcomes, scroll for more" className="max-h-40 min-h-0 overflow-y-auto overscroll-contain [mask-image:linear-gradient(to_bottom,black_0%,black_88%,transparent_100%)]">{report.results.map((r,i)=><p key={r.line+":"+r.applicationId+":"+i}>
    {r.applicationId}: {r.status} {r.reason??""}</p>)}</div>
   <p>Stage completed. Use the Apply results preview above to publish progression when the round is completed.</p>
  </div>:null}
  {error?<p role="alert" className="text-sm text-foreground">{error} Re-preview if the round has changed.</p>:null}
 </section>;
}

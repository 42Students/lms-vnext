"use client";
import {useState,type MouseEvent} from "react";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {TpoBulkDriveReminder} from "./tpo-bulk-drive-reminder";
import {Button} from "@/components/ui/button";
import {Checkbox} from "@/components/ui/checkbox";
import {InlineNotice} from "@/components/ui/inline-notice";
import {Select} from "@/components/ui/select";
import {Textarea} from "@/components/ui/textarea";
type Action="CLOSE"|"CANCEL";
type Preview={id:string;title:string;allowed:boolean;reason:string;
 expectedUpdatedAt:string|null;expectedCounts?:{applications:number;rounds:number;offers:number};
 expectedImpact?:{submittedApplications:number;openRounds:number;issuedOffers:number;acceptedOffers:number}};
type Outcome={id:string;status:"completed"|"failed"|"left-out";reason:string};
function selectedFrom(event:MouseEvent<HTMLButtonElement>):string[]{
 const form=event.currentTarget.form;
 if(!form)return [];
 return [...new Set(new FormData(form).getAll("ids").filter((value):value is string=>typeof value==="string"))]
  .filter(value=>/^[0-9a-f-]{36}$/i.test(value)).slice(0,25);
}
/** TPO-drives-13: explicit preview, per-row reasons, CAS application and retry.
 * TPO server authorizes each job again; the browser's selection grants nothing.
 */
export function TpoDriveActOnPanel(){
 const [open,setOpen]=useState(false);
 const [confirmRetry,setConfirmRetry]=useState<boolean|null>(null);
 const [action,setAction]=useState<Action>("CLOSE");
 const [rows,setRows]=useState<Preview[]>([]);
 const [results,setResults]=useState<Outcome[]>([]);
 const [reason,setReason]=useState("");
 const [acknowledged,setAcknowledged]=useState(false);
 const [notice,setNotice]=useState("");
 const {pending,run}=useGuardedAction({timeoutMs:60000});
 async function preview(event:MouseEvent<HTMLButtonElement>){
  const ids=selectedFrom(event);
  setNotice("");setResults([]);setAcknowledged(false);
  if(!ids.length){setNotice("Select at least one visible drive.");return;}
  const path=action==="CLOSE"?"close-preview":"cancel-preview";
  const proposed:Preview[]=[];
  await run(async()=>{
   for(const id of ids){
    try{
     const response=await fetch("/api/placements/tpo/jobs/"+encodeURIComponent(id)+"/"+path,{
      credentials:"same-origin",cache:"no-store"});
     if(!response.ok)throw Error("This drive is not available for this action");
     const data=await response.json() as {
      title?:string;canClose?:boolean;cancellable?:boolean;
      expectedUpdatedAt?:string;counts?:Preview["expectedCounts"];
      impact?:Preview["expectedImpact"];issuedOffers?:number;pendingSelections?:number;
     };
     const allowed=action==="CLOSE"?data.canClose===true:data.cancellable===true;
     const skipped=action==="CLOSE"&&data.pendingSelections?
      "Unreleased selections must be resolved first":
      action==="CLOSE"&&data.issuedOffers?"Issued offers still need a decision":
      "Drive is no longer eligible";
     proposed.push({id,title:data.title??"Drive",allowed,reason:allowed?"Ready":skipped,
      expectedUpdatedAt:data.expectedUpdatedAt??null,
      ...(data.counts !== undefined ? { expectedCounts: data.counts } : {}),
      ...(data.impact !== undefined ? { expectedImpact: data.impact } : {})});
    }catch{proposed.push({id,title:"Drive",allowed:false,reason:"Preflight failed",expectedUpdatedAt:null});}
   }
   setRows(proposed);
  });
 }
 async function apply(onlyFailed=false,confirmed=false){
  if(reason.trim().length<10){setNotice("Explain the bulk action in at least 10 characters.");return;}
  if(action==="CLOSE"&&!acknowledged){
   setNotice("Acknowledge the irreversible close consequences before continuing.");return;
  }
  const current=rows.filter(item=>item.allowed&&item.expectedUpdatedAt&&
   (!onlyFailed||results.some(v=>v.id===item.id&&v.status==="failed")));
  if(!current.length){setNotice("No applicable drives to change.");return;}
  if(!confirmed){setConfirmRetry(onlyFailed);return;}
  const output:Outcome[]=onlyFailed?results.filter(item=>item.status!=="failed"):[];
  await run(async()=>{
   for(const row of current){
    const uri="/api/placements/tpo/jobs/"+encodeURIComponent(row.id)+"/"+(action==="CLOSE"?"close-preview":"cancel-preview");
    const payload=action==="CLOSE"?{
     action:"CLOSE",confirmed:true,expectedUpdatedAt:row.expectedUpdatedAt,
     expectedCounts:row.expectedCounts,reason:reason.trim(),
    }:{
     action:"CANCEL",confirmed:true,expectedUpdatedAt:row.expectedUpdatedAt,
     expectedImpact:row.expectedImpact,reason:reason.trim(),
    };
    try{
     const response=await fetch(uri,{method:"POST",credentials:"same-origin",
      headers:{"content-type":"application/json"},body:JSON.stringify(payload)});
     if(!response.ok)throw Error("Status changed or processing failed; refresh its preview");
     output.push({id:row.id,status:"completed",reason:"Audited update saved"});
    }catch{output.push({id:row.id,status:"failed",reason:"Could not apply; refresh preview before retry"});}
   }
   setResults([...output,...rows.filter(item=>!item.allowed).map(item=>({id:item.id,status:"left-out" as const,reason:item.reason}))]);
   setNotice(output.filter(row=>row.status==="completed").length+" succeeded; "+
    output.filter(row=>row.status==="failed").length+" failed. Review each result.");
  });
 }
 async function copyFailed(){
  const failed=results.filter(item=>item.status==="failed");
  try{await navigator.clipboard.writeText(failed.map(x=>x.id+" — "+x.reason).join("\n"));
   setNotice("Failed drive IDs copied.");
  }catch{setNotice("Clipboard unavailable. Failed drives remain listed below.");}
 }
 return <section aria-label="Act on selected drives" className="min-w-0 space-y-3" aria-busy={pending}>
  <Button variant="secondary" type="button" className="min-h-11 w-full sm:w-auto md:min-h-9" disabled={pending} onClick={()=>setOpen(!open)} aria-expanded={open}
   aria-controls="tpo-drive-bulk-actions">Act on selected drives</Button>
  {open?<div id="tpo-drive-bulk-actions" role="region" aria-label="Selected drive actions" className="min-w-0 space-y-4 border-t border-border pt-4">
   <p className="text-sm text-body leading-[22px]">Actions only apply to checked rows on this page. Every drive is rechecked by the placement server before applying a change.</p>
   <details className="min-w-0 border-b border-border pb-3">
    <summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold md:min-h-9">Other selected-drive actions</summary>
    <div className="pt-2"><TpoBulkDriveReminder/></div>
   </details>
   <div className="grid min-w-0 items-end gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
   <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold">Action
    <Select className="min-h-11 w-full min-w-0 md:min-h-9" value={action} onChange={e=>{setAction(e.target.value as Action);setRows([]);setResults([]);setNotice("");setAcknowledged(false);}}
     >
     <option value="CLOSE">Close selected live drives</option>
     <option value="CANCEL">Cancel selected drives</option>
    </Select>
   </label>
   <Button variant="primary" className="min-h-11 w-full sm:w-auto md:min-h-9" type="button" disabled={pending} loading={pending} onClick={e=>void preview(e)}
    >Preview applicable drives</Button>
   </div>
   {rows.length?<div className="min-w-0 space-y-3 border-t border-border pt-4">
    <p role="status" className="text-sm leading-[22px]">{rows.filter(row=>row.allowed).length} applicable · {rows.filter(row=>!row.allowed).length} left out</p>
    {action==="CLOSE"?<p role="status" className="text-sm text-body">
     Preflight impact for {rows.filter(item=>item.allowed).length} eligible drives:
     {" "+rows.filter(item=>item.allowed).reduce((sum,item)=>sum+(item.expectedCounts?.applications??0),0)} applications,
     {" "+rows.filter(item=>item.allowed).reduce((sum,item)=>sum+(item.expectedCounts?.rounds??0),0)} rounds and
     {" "+rows.filter(item=>item.allowed).reduce((sum,item)=>sum+(item.expectedCounts?.offers??0),0)} offers.
     Only drives with verified snapshots can be changed. Historical records remain visible.
    </p>:null}
    <ul className="min-w-0 divide-y divide-border text-sm">{rows.map(row=><li key={row.id} className="flex min-w-0 flex-col gap-1 py-2 sm:flex-row sm:justify-between sm:gap-3">
     <span className="break-words font-medium">{row.title}</span>
     <span className={row.allowed?"text-body":"text-muted-foreground"}>{row.reason}
      {action==="CLOSE"&&row.expectedCounts?<span className="block text-xs">Applications: {row.expectedCounts.applications}, rounds: {row.expectedCounts.rounds}, offers: {row.expectedCounts.offers}</span>:null}
     </span>
    </li>)}</ul>
    <label className="grid min-w-0 max-w-xl gap-[6px] text-[13px] font-semibold">Reason (audited)
     <Textarea className="min-w-0 w-full" value={reason} onChange={e=>{setReason(e.target.value);setNotice("");}} rows={3} minLength={10} maxLength={1000}
      />
    </label>
    {action==="CLOSE"?<label className="flex min-h-11 items-start gap-2 text-sm font-medium leading-6">
      <Checkbox checked={acknowledged} onChange={event=>setAcknowledged(event.target.checked)}/>
      I understand that closing the selected drives is irreversible in this workflow. Applicants and offers can be affected; results remain in the audit history.
     </label>:null}
    <Button variant="primary" className="min-h-11 w-full sm:w-auto md:min-h-9" type="button" disabled={pending||!rows.some(row=>row.allowed)||reason.trim().length<10||(action==="CLOSE"&&!acknowledged)}
      onClick={()=>void apply()} >
     {pending?"Applying…":"Confirm selected action"}</Button>
   </div>:null}
   {results.length?<div className="min-w-0 space-y-2 border-t border-border pt-4">
    <p className="text-sm font-semibold leading-[22px]">Per-drive results and retry</p>
    <ul className="min-w-0 divide-y divide-border text-sm">{results.map(row=><li key={row.id} className="min-w-0 break-all py-2">{row.id} · {row.status} · {row.reason}</li>)}</ul>
    {results.some(row=>row.status==="failed")?<div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
     <Button variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9" type="button" disabled={pending} onClick={()=>void apply(true)} >Retry failed</Button>
     <Button variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9" type="button" disabled={pending} onClick={()=>void copyFailed()} >Copy failed</Button>
    </div>:null}
   </div>:null}
   {notice?<InlineNotice
    tone={results.some(item=>item.status==="failed")||notice.startsWith("Could not")||
      notice.startsWith("Select at least")||notice.startsWith("Explain")||
      notice.startsWith("No applicable")?"error":"info"}
    message={notice}/>:null}
  </div>:null}
  <ConfirmDialog open={confirmRetry!==null}
    onOpenChange={next=>{if(!next&&!pending)setConfirmRetry(null);}}
    pending={pending}
    title={"Apply "+action.toLowerCase()+" to "+rows.filter(item=>item.allowed&&item.expectedUpdatedAt&&(confirmRetry!==true||results.some(v=>v.id===item.id&&v.status==="failed"))).length+" eligible drives?"}
    description={action==="CLOSE"?"Closing these drives is irreversible in this workflow. Affected applications, rounds and offers remain auditable.":"Each change is audited. Changes to applicants and offers are not silently reversible."}
    confirmLabel="Confirm selected action"
    onConfirm={()=>{if(confirmRetry===null||pending)return;const retry=confirmRetry;void (async()=>{try{await apply(retry,true);}catch{setNotice("Could not complete the bulk action. Refresh the preview and try again.");}finally{setConfirmRetry(null);}})();}}/>
 </section>;
}

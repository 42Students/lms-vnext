"use client";
import {useState,type MouseEvent} from "react";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {TpoBulkDriveReminder} from "./tpo-bulk-drive-reminder";
import {Button} from "@/components/ui/button";
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
 const [notice,setNotice]=useState("");
 const {pending,run}=useGuardedAction({timeoutMs:60000});
 async function preview(event:MouseEvent<HTMLButtonElement>){
  const ids=selectedFrom(event);
  setNotice("");setResults([]);
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
      expectedCounts:data.counts,expectedImpact:data.impact});
    }catch{proposed.push({id,title:"Drive",allowed:false,reason:"Preflight failed",expectedUpdatedAt:null});}
   }
   setRows(proposed);
  });
 }
 async function apply(onlyFailed=false,confirmed=false){
  if(reason.trim().length<10){setNotice("Explain the bulk action in at least 10 characters.");return;}
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
 return <section aria-label="Act on selected drives" className="space-y-3 border-t border-border pt-4">
  <Button variant="secondary" type="button" onClick={()=>setOpen(!open)} aria-expanded={open}
   >Act on selected drives</Button>
  {open?<div className="space-y-4">
   <p className="text-sm text-body">Actions only apply to checked rows on this page. Every drive is rechecked by the placement server before applying a change.</p>
   <TpoBulkDriveReminder/>
   <label className="grid max-w-sm gap-1 text-sm font-semibold">Action
    <Select value={action} onChange={e=>{setAction(e.target.value as Action);setRows([]);setResults([]);}}
     >
     <option value="CLOSE">Close selected live drives</option>
     <option value="CANCEL">Cancel selected drives</option>
    </Select>
   </label>
   <Button variant="secondary" type="button" disabled={pending} onClick={e=>void preview(e)}
    >Preview applicable drives</Button>
   {rows.length?<div className="space-y-2">
    <p role="status" className="text-sm">{rows.filter(row=>row.allowed).length} applicable · {rows.filter(row=>!row.allowed).length} left out</p>
    <ul className="space-y-1 text-sm">{rows.map(row=><li key={row.id}>{row.title} · {row.reason}</li>)}</ul>
    <label className="grid max-w-lg gap-1 text-sm font-semibold">Reason (audited)
     <Textarea value={reason} onChange={e=>setReason(e.target.value)} rows={2} maxLength={1000}
      />
    </label>
    <Button variant="secondary" type="button" disabled={pending||!rows.some(row=>row.allowed)}
      onClick={()=>void apply()} >
     {pending?"Applying…":"Confirm selected action"}</Button>
   </div>:null}
   {results.length?<div className="space-y-2">
    <p className="text-sm font-semibold">Per-drive results and retry</p>
    <ul className="space-y-1 text-sm">{results.map(row=><li key={row.id}>{row.id} · {row.status} · {row.reason}</li>)}</ul>
    {results.some(row=>row.status==="failed")?<div className="flex flex-wrap gap-3">
     <Button variant="secondary" type="button" disabled={pending} onClick={()=>void apply(true)} >Retry failed</Button>
     <Button variant="secondary" type="button" onClick={()=>void copyFailed()} >Copy failed</Button>
    </div>:null}
   </div>:null}
   {notice?<p role="status" className="text-sm">{notice}</p>:null}
  </div>:null}
  <ConfirmDialog open={confirmRetry!==null}
    onOpenChange={next=>{if(!next&&!pending)setConfirmRetry(null);}}
    pending={pending}
    title={"Apply "+action.toLowerCase()+" to "+rows.filter(item=>item.allowed&&item.expectedUpdatedAt&&(confirmRetry!==true||results.some(v=>v.id===item.id&&v.status==="failed"))).length+" eligible drives?"}
    description="Each change is audited. Changes to applicants and offers are not silently reversible."
    confirmLabel="Confirm selected action"
    onConfirm={()=>{if(confirmRetry!==null){const retry=confirmRetry;setConfirmRetry(null);void apply(retry,true);}}}/>
 </section>;
}

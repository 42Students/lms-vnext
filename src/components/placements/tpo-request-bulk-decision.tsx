"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {Dialog} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {tpoRequestFailedRowsTsv} from "@/modules/placements/tpo-request-failed-rows-model";

type Row={id:string;studentName:string;requestType:string;expectedUpdatedAt:string};
type Outcome={id:string;name:string;status:"updated"|"failed";message:string};
const MAX_BULK_REQUESTS=10;

/** Decisions remain separate tenant-scoped and version-checked transactions. */
export function TpoRequestBulkDecision({rows}:{rows:readonly Row[]}){
 const router=useRouter();
 const {run:runGuarded,pending}=useGuardedAction({timeoutMs:120000});
 const [selected,setSelected]=useState<string[]>([]);
 const [action,setAction]=useState<"APPROVE"|"REJECT">("APPROVE");
 const [reason,setReason]=useState("");
 const [confirmOpen,setConfirmOpen]=useState(false);
 const [acknowledged,setAcknowledged]=useState(false);
 const [error,setError]=useState("");
 const [outcomes,setOutcomes]=useState<Outcome[]>([]);
 async function copyFailed(){
  const text=tpoRequestFailedRowsTsv(outcomes);
  if(!text)return;
  try{
   await navigator.clipboard.writeText(text);
  }catch{setError("Could not copy failed requests. Check browser clipboard permissions.");}
 }
 const chosen=rows.filter(row=>selected.includes(row.id));
 const chosenKind=chosen[0]?.requestType??null;
 const valid=chosen.length>0&&chosen.length<=MAX_BULK_REQUESTS&&
  chosen.every(row=>row.requestType===chosenKind)&&
  (action==="APPROVE"||reason.trim().length>=3);
 function toggle(row:Row,checked:boolean){
  if(checked&&(selected.length>=MAX_BULK_REQUESTS||chosenKind!==null&&chosenKind!==row.requestType))return;
  setSelected(ids=>checked?[...ids,row.id]:ids.filter(id=>id!==row.id));
  setConfirmOpen(false);setAcknowledged(false);setOutcomes([]);setError("");
 }
 async function submit(){
  if(!valid||!acknowledged||pending)return;
  setError("");
  try{
   await runGuarded(async()=>{
    const results:Outcome[]=[];
    for(const row of chosen){
     try{
      await apiFetch("/api/placements/tpo/requests/"+encodeURIComponent(row.id)+"/decision",{
       method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},
       body:JSON.stringify({confirmed:true,action,note:action==="REJECT"?reason.trim():"",
        expectedUpdatedAt:row.expectedUpdatedAt}),
      });
      results.push({id:row.id,name:row.studentName,status:"updated",
       message:action==="APPROVE"?"Approved. The student has been told.":
       "Rejected. The student has been told, with your reason."});
     }catch{
      results.push({id:row.id,name:row.studentName,status:"failed",
       message:"This request was not decided. Open it to check its current status before retrying."});
     }
    }
    setOutcomes(results);
    setSelected(ids=>ids.filter(id=>!results.some(result=>result.id===id&&result.status==="updated")));
    setAcknowledged(false);setConfirmOpen(false);
    router.refresh();
   });
  }catch{
   setError("The request review did not finish. Check the decisions before retrying.");
  }
 }
 return <section aria-label="Bulk request decisions" className="space-y-3 rounded-xl border border-border bg-surface p-4">
  <h2 className="font-semibold">Act on selected requests</h2>
  <p className="text-xs text-muted-foreground">Choose up to {MAX_BULK_REQUESTS} waiting requests of one kind on this page. Each decision is rechecked and saved separately; a failure never approves the next request.</p>
  <div className="max-h-64 space-y-1 overflow-y-auto">
   {rows.map(row=><label key={row.id} className="flex min-h-11 items-center gap-2 rounded border border-border p-2 text-sm">
    <input type="checkbox" checked={selected.includes(row.id)}
     disabled={pending||(!selected.includes(row.id)&&(selected.length>=MAX_BULK_REQUESTS||
      chosenKind!==null&&chosenKind!==row.requestType))}
     onChange={event=>toggle(row,event.target.checked)}/>
    <span className="min-w-0 break-words">{row.studentName} · {row.requestType.replaceAll("_"," ")}</span>
   </label>)}
  </div>
  <p role="status" className="text-sm">{chosen.length} selected of {rows.length} waiting requests on this page.</p>
  <label className="grid gap-1 text-sm">Decision
   <select value={action} disabled={pending} onChange={event=>{setAction(event.target.value as "APPROVE"|"REJECT");setAcknowledged(false);}}
    className="min-h-11 rounded border border-border bg-surface px-3">
    <option value="APPROVE">Approve</option><option value="REJECT">Reject</option>
   </select>
  </label>
  {action==="REJECT"?<label className="grid gap-1 text-sm">Rejection reason (required)
   <textarea value={reason} disabled={pending} minLength={3} maxLength={2000}
    onChange={event=>{setReason(event.target.value);setAcknowledged(false);}}
    className="min-h-20 rounded border border-border p-2"/>
  </label>:null}
  <button type="button" disabled={!valid||pending} onClick={()=>{setAcknowledged(false);setConfirmOpen(true);}}
   className="min-h-11 rounded border border-border px-4 text-sm font-semibold disabled:opacity-50">
   Review {chosen.length} selected decision(s)
  </button>
  <Dialog open={confirmOpen} onOpenChange={value=>{if(!pending)setConfirmOpen(value);}}
   title={action==="APPROVE"?"Approve selected requests?":"Reject selected requests?"}
   description={action==="APPROVE"?
    "Students are told straight away. Each approval may change a placement record and cannot be undone here.":
    "Each selected student will receive your recorded rejection reason."}
   footer={<><Button variant="secondary" disabled={pending} onClick={()=>setConfirmOpen(false)}>Cancel</Button>
    <Button disabled={!valid||!acknowledged||pending} onClick={()=>void submit()}>
     {pending?"Saving decisions…":"Confirm decisions"}
    </Button></>}>
   <p className="text-sm">Review {chosen.length} {chosenKind?.replaceAll("_"," ").toLowerCase()} request(s) one by one.</p>
   <ul className="max-h-40 list-disc overflow-auto pl-5 text-sm">
    {chosen.map(row=><li key={row.id}>{row.studentName}</li>)}
   </ul>
   <label className="mt-3 flex items-start gap-2 text-sm">
    <input type="checkbox" checked={acknowledged} disabled={pending}
     onChange={event=>setAcknowledged(event.target.checked)}/>
    I have reviewed these requests and understand the decisions cannot be undone here.
   </label>
  </Dialog>
  {outcomes.length>0?<div role="status" aria-live="polite" className="space-y-2 text-sm">
   <p>{outcomes.filter(row=>row.status==="updated").length} decided · {outcomes.filter(row=>row.status==="failed").length} not decided.</p>
   <ul className="space-y-1">{outcomes.map(row=><li key={row.id} className="rounded border border-border p-2">
    <strong>{row.name}</strong>: {row.message}
   </li>)}</ul>
   {outcomes.some(row=>row.status==="failed")?<div className="space-y-2">
    <p role="alert">Some requests were not decided. Recheck them before retrying.</p>
    <button type="button" onClick={()=>void copyFailed()} className="min-h-10 rounded border border-border px-3 font-semibold text-primary-text">Copy failed</button>
   </div>:null}
  </div>:null}
  {error?<p role="alert" className="text-error">{error}</p>:null}
 </section>;
}

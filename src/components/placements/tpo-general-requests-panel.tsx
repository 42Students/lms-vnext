"use client";
import {useEffect,useState} from "react";
import {apiFetch} from "@/lib/api-fetch";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {Dialog} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {tpoGeneralRequestReviewFacts} from "@/modules/placements/tpo-general-request-review-facts";
type Request={id:string;kind:string;status:string;reason:string;payload:Record<string,unknown>;
 studentName:string|null;version:string;requestedAt:string;decisionNote:string|null};
function TpoGeneralRequestFacts({kind,payload}:{kind:string;payload:Record<string,unknown>}){
 const detail=tpoGeneralRequestReviewFacts(kind,payload);
 return <div className="space-y-2">
  {detail.facts.length?<dl className="grid gap-2 sm:grid-cols-2">{detail.facts.map(item=>
   <div key={item.label} className="rounded-[var(--lms-control-radius)] border border-border p-2">
    <dt className="text-xs text-muted-foreground">{item.label}</dt>
    <dd className="break-words font-medium">{item.value}</dd>
   </div>)}</dl>:null}
  {detail.proofUrl?<a href={detail.proofUrl} target="_blank" rel="noopener noreferrer"
   className="inline-flex min-h-11 items-center text-primary-text underline">Review submitted proof link</a>:
   detail.requiresProof?<p role="alert" className="text-[var(--lms-gold-accent)]">No proof attached</p>:null}
 </div>;
}
export function TpoGeneralRequestsPanel(){
 const [rows,setRows]=useState<Request[]>([]),[error,setError]=useState("");
 const [selection,setSelection]=useState<Request|null>(null),[action,setAction]=useState<"APPROVE"|"REJECT">("REJECT");
 const [note,setNote]=useState(""),[message,setMessage]=useState("");
 const {run,pending}=useGuardedAction();
 async function load(){
  try{
   const data=await apiFetch<{requests:Request[]}>("/api/placements/tpo/requests/general",{cache:"no-store"});
   setRows(data.requests);setError("");
  }catch{setError("Other student requests could not be loaded. Retry to refresh.");}
 }
 useEffect(()=>{void Promise.resolve().then(load);},[]);
 async function decide(){
  if(!selection||pending)return;
  if(action==="REJECT"&&note.trim().length<3){setError("Tell the learner why this request was declined.");return;}
  setError("");setMessage("");
  try{
   await run(async()=>{
    await apiFetch("/api/placements/tpo/requests/general/"+encodeURIComponent(selection.id)+"/decision",{
     method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},
     body:JSON.stringify({confirmed:true,version:selection.version,action,note:note.trim()}),
    });
    setMessage(action==="APPROVE"?"Request approved. The recorded change and learner notice were saved.":"Request declined. The learner was notified.");
    setSelection(null);await load();
   });
  }catch{setError("This decision was not saved. The request may have changed, or its effect needs specialist review. Refresh before retrying.");}
 }
 const pendingRows=rows.filter(row=>row.status==="PENDING");
 const approveSupported=(kind:string)=>["OFF_CAMPUS_OFFER","REGISTRATION_CHANGE"].includes(kind);
 return <section aria-label="Other student requests" className="space-y-3 border-b border-border pb-5">
  <h2 className="font-semibold">Other student requests · {pendingRows.length} waiting</h2>
  <p className="text-sm">Off-campus offers, registration changes, attendance disputes, profile corrections, and requests after placement. Approval is enabled only where the database effect is fully supported; the others require a separate specialist workflow.</p>
  <Button variant="secondary" type="button" onClick={()=>void load()} className="min-h-11 px-3">Refresh other requests</Button>
  {error?<p role="alert" className="text-error">{error}</p>:null}
  {message?<p role="status">{message}</p>:null}
  {!rows.length?<p role="status" className="text-sm">No other requests to review.</p>:
   <ul tabIndex={0} aria-label="Student requests, scroll for more" className="max-h-[700px] min-h-0 space-y-2 overflow-y-auto overscroll-contain [mask-image:linear-gradient(to_bottom,black_0%,black_90%,transparent_100%)]">{rows.map(row=><li key={row.id} className="rounded-[var(--lms-control-radius)] border border-border p-3 text-sm">
    <h3 className="font-semibold">{row.studentName??"Student"} · {row.kind.replaceAll("_"," ").toLowerCase()}</h3>
    <p className="break-words">{row.reason}</p>
    <p className="text-xs">{row.status.replaceAll("_"," ")}</p>
    <TpoGeneralRequestFacts kind={row.kind} payload={row.payload}/>
    {row.decisionNote?<p>Decision: {row.decisionNote}</p>:null}
    {row.status==="PENDING"?<Button variant="secondary" type="button" disabled={pending} className="mt-2 min-h-11 px-3"
      onClick={()=>{setSelection(row);setNote("");setAction("REJECT");}}>Review request</Button>:null}
   </li>)}</ul>}
  <Dialog open={selection!==null} onOpenChange={open=>{if(!open&&!pending)setSelection(null);}}
   title={"Review "+(selection?.kind.replaceAll("_"," ").toLowerCase()??"request")}
   description="The learner receives your reason. An approval must save its domain consequence and the audit in the same transaction."
   footer={<><Button variant="secondary" disabled={pending} onClick={()=>setSelection(null)}>Cancel</Button>
    <Button disabled={pending||(action==="APPROVE"&&!approveSupported(selection?.kind??""))} onClick={()=>void decide()}>
      {pending?"Saving…":"Confirm decision"}</Button></>}>
   <p className="break-words text-sm">{selection?.reason}</p>
   <label className="mt-3 grid gap-1 text-sm">Decision
    <select value={action} onChange={e=>setAction(e.target.value as "APPROVE"|"REJECT")} className="min-h-11 rounded-[var(--lms-control-radius)] border border-border p-2">
     {approveSupported(selection?.kind??"")?<option value="APPROVE">Approve and apply</option>:null}
     <option value="REJECT">Decline with reason</option>
    </select>
   </label>
   <label className="mt-3 grid gap-1 text-sm">Reason / decision note
    <textarea value={note} onChange={e=>setNote(e.target.value)} className="min-h-24 rounded-[var(--lms-control-radius)] border border-border p-2" maxLength={2000}/>
   </label>
   {!approveSupported(selection?.kind??"")?<p className="text-sm">A specialist review is required before this kind can be approved. No placement record will be silently changed.</p>:null}
  </Dialog>
 </section>;
}

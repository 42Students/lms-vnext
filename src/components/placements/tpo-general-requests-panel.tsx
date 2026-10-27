"use client";
import {useEffect,useState} from "react";
import {apiFetch} from "@/lib/api-fetch";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {Dialog} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {InlineNotice} from "@/components/ui/inline-notice";
import {EmptyState} from "@/components/ui/empty-state";
import {tpoGeneralRequestReviewFacts} from "@/modules/placements/tpo-general-request-review-facts";
import {TpoGeneralRequestsBulkDecision} from "@/components/placements/tpo-general-requests-bulk-decision";
import {tpoGeneralRequestCanApprove} from "@/modules/placements/tpo-general-request-model";
import {Select} from "@/components/ui/select";
import {Textarea} from "@/components/ui/textarea";
type Request={id:string;kind:string;status:string;reason:string;payload:Record<string,unknown>;
 studentName:string|null;version:string;requestedAt:string;decisionNote:string|null};
function TpoGeneralRequestFacts({kind,payload}:{kind:string;payload:Record<string,unknown>}){
 const detail=tpoGeneralRequestReviewFacts(kind,payload);
 return <div className="min-w-0 space-y-2">
  {detail.facts.length?<dl className="grid min-w-0 gap-x-4 gap-y-2 sm:grid-cols-2">{detail.facts.map(item=>
   <div key={item.label} className="min-w-0 border-b border-border py-2">
    <dt className="text-xs text-muted-foreground">{item.label}</dt>
    <dd className="break-words font-medium">{item.value}</dd>
   </div>)}</dl>:null}
  {detail.proofUrl?<a href={detail.proofUrl}
   className="inline-flex min-h-11 items-center text-primary-text underline focus-visible:underline">{detail.proofLabel}</a>:
   detail.requiresProof?<InlineNotice tone="error" message={detail.proofIssue??"No proof attached"}/>:null}
 </div>;
}
export function TpoGeneralRequestsPanel(){
 const [rows,setRows]=useState<Request[]>([]),[error,setError]=useState("");
 const [loading,setLoading]=useState(true);
 const [selection,setSelection]=useState<Request|null>(null),[action,setAction]=useState<"APPROVE"|"REJECT">("REJECT");
 const [note,setNote]=useState(""),[message,setMessage]=useState("");
 const {run,pending}=useGuardedAction();
 async function load(){
  setLoading(true);
  try{
   const data=await apiFetch<{requests:Request[]}>("/api/placements/tpo/requests/general",{cache:"no-store"});
   setRows(data.requests);setError("");
  }catch{setError("Other student requests could not be loaded. Retry to refresh.");}
  finally{setLoading(false);}
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
 const approveSupported=tpoGeneralRequestCanApprove;
 return <section aria-label="Other student requests" className="space-y-3 border-b border-border pb-5">
  <h2 className="font-semibold text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px] text-[var(--lms-heading)]">Other student requests · {pendingRows.length} waiting</h2>
  <p className="text-sm leading-[22px]">Off-campus offers, registration changes, attendance disputes, profile corrections, and requests after placement. Approval is enabled only where the database effect is fully supported; the others require a separate specialist workflow.</p>
  <Button variant="secondary" type="button" onClick={()=>void load()} loading={loading} disabled={loading} className="min-h-11 w-full px-3 sm:w-auto md:min-h-9">Refresh other requests</Button>
  {error?<InlineNotice tone="error" message={error}/>:null}
  {message?<InlineNotice tone="success" message={message}/>:null}
  {!loading&&pendingRows.length>0?<TpoGeneralRequestsBulkDecision rows={pendingRows} onReviewed={load}/>:null}
  {loading&&!rows.length?<p role="status" className="py-4 text-sm text-body leading-[22px]">Loading other student requests…</p>:!rows.length?<EmptyState title="No other requests to review."/>:
   <ul tabIndex={0} aria-label="Student requests, scroll for more" className="max-h-[min(70vh,44rem)] min-h-0 min-w-0 divide-y divide-[var(--lms-canvas-border)] overflow-y-auto overscroll-contain [mask-image:linear-gradient(to_bottom,black_0%,black_90%,transparent_100%)]">{rows.map(row=><li key={row.id} className="min-w-0 py-3 text-sm">
    <h3 className="break-words font-semibold">{row.studentName??"Student"} · {row.kind.replaceAll("_"," ").toLowerCase()}</h3>
    <p className="break-words text-body">{row.reason}</p>
    <p className="text-xs leading-[20px]">{row.status.replaceAll("_"," ")}</p>
    <details className="min-w-0 py-1"><summary className="min-h-11 cursor-pointer py-3 font-semibold text-primary-text md:min-h-9 md:py-2">Request details</summary>
     <TpoGeneralRequestFacts kind={row.kind} payload={row.payload}/>
    </details>
    {row.decisionNote?<p>Decision: {row.decisionNote}</p>:null}
    {row.status==="PENDING"?<Button variant="secondary" type="button" disabled={pending} className="mt-2 min-h-11 w-full px-3 sm:w-auto md:min-h-9"
      onClick={()=>{setSelection(row);setNote("");setAction("REJECT");}}>Review request</Button>:null}
   </li>)}</ul>}
  <Dialog open={selection!==null} onOpenChange={open=>{if(!open&&!pending)setSelection(null);}}
   title={"Review "+(selection?.kind.replaceAll("_"," ").toLowerCase()??"request")}
   description="The learner receives your reason. An approval must save its domain consequence and the audit in the same transaction."
   footer={<div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
    <Button className="min-h-11 w-full sm:w-auto md:min-h-9" variant="secondary" disabled={pending} onClick={()=>setSelection(null)}>Cancel</Button>
    <Button className="min-h-11 w-full sm:w-auto md:min-h-9" loading={pending} disabled={pending||(action==="APPROVE"&&!approveSupported(selection?.kind??""))} onClick={()=>void decide()}>
      {pending?"Saving…":"Confirm decision"}</Button></div>}>
   <div className="min-w-0 space-y-3 break-words">
    <p className="text-sm leading-[22px]">{selection?.reason}</p>
    {selection?<TpoGeneralRequestFacts kind={selection.kind} payload={selection.payload}/>:null}
   <label className="mt-3 grid gap-[6px] text-[13px]">Decision
    <Select value={action} onChange={e=>setAction(e.target.value as "APPROVE"|"REJECT")} >
     {approveSupported(selection?.kind??"")?<option value="APPROVE">Approve and apply</option>:null}
     <option value="REJECT">Decline with reason</option>
    </Select>
   </label>
   <label className="mt-3 grid gap-[6px] text-[13px]">Reason / decision note
    <Textarea value={note} onChange={e=>setNote(e.target.value)} maxLength={2000}/>
   </label>
   {!approveSupported(selection?.kind??"")?<p className="text-sm leading-[22px]">A specialist review is required before this kind can be approved. No placement record will be silently changed.</p>:null}
   {selection&&error?<InlineNotice tone="error" message={error}/>:null}
   </div>
  </Dialog>
 </section>;
}

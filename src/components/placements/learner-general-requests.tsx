"use client";
import { Checkbox } from "@/components/ui/checkbox";
import {useCallback,useEffect,useRef,useState} from "react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {Textarea} from "@/components/ui/textarea";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Dialog} from "@/components/ui/dialog";
import {FileUpload} from "@/components/ui/file-upload";
import {apiFetch} from "@/lib/api-fetch";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {tpoGeneralRequestInputSchema} from "@/modules/placements/tpo-general-request-model";
type History={id:string;kind:string;status:string;reason:string;requestedAt:string;decisionNote:string|null};
type Kind="OFF_CAMPUS_OFFER"|"REGISTRATION_CHANGE"|"ABSENCE_DISPUTE"|"CORRECTION_WITH_PROOF"|"PLACEMENT_AFTER_PLACEMENT"|"OFFER_ACCEPTANCE_DISPUTE";
const kinds:readonly [Kind,string][]=[
 ["OFF_CAMPUS_OFFER","Off-campus offer"],["REGISTRATION_CHANGE","Registration change"],
 ["ABSENCE_DISPUTE","Absence dispute"],["OFFER_ACCEPTANCE_DISPUTE","Externally reported acceptance"],["CORRECTION_WITH_PROOF","Correction with proof"],
 ["PLACEMENT_AFTER_PLACEMENT","Placement after placement"]];
const box="min-h-11 md:min-h-9";
const requestState:Record<string,{label:string;tone:string}>={
 PENDING:{label:"Waiting for the placement cell",tone:"border-[var(--lms-warning)] bg-[var(--lms-warning-subtle)]"},
 APPROVED:{label:"Approved",tone:"border-[var(--lms-success)] bg-[var(--lms-success-subtle)]"},
 AUTO_APPROVED:{label:"Approved",tone:"border-[var(--lms-success)] bg-[var(--lms-success-subtle)]"},
 REJECTED:{label:"Not approved",tone:"border-[var(--lms-error)] bg-[var(--lms-error-subtle)]"},
};
function sentAgo(iso:string):string {
 const delta=(new Date(iso).getTime()-Date.now())/1000;
 if(!Number.isFinite(delta))return "";
 const abs=Math.abs(delta);
 const [unit,divisor]:[Intl.RelativeTimeFormatUnit,number]=
  abs<60?["second",1]:abs<3600?["minute",60]:abs<86400?["hour",3600]:abs<2592000?["day",86400]:
  abs<31536000?["month",2592000]:["year",31536000];
 return "Sent "+new Intl.RelativeTimeFormat("en",{numeric:"auto"}).format(Math.round(delta/divisor),unit);
}
export function LearnerGeneralRequests({
 initialKind="OFF_CAMPUS_OFFER",initialApplicationId="",initialRoundId="",initialOfferId="",initialNoticeBody="",
}:{initialKind?:Kind;initialApplicationId?:string;initialRoundId?:string;initialOfferId?:string;initialNoticeBody?:string}){
 const [rows,setRows]=useState<History[]>([]),[cohortId,setCohortId]=useState("");
 const [historyPage,setHistoryPage]=useState(1),[historyTotal,setHistoryTotal]=useState(0);
 const [historyTotalPages,setHistoryTotalPages]=useState(1);
 const [historyLoading,setHistoryLoading]=useState(true),[historyError,setHistoryError]=useState("");
 const historyGeneration=useRef(0);
 const [kind,setKind]=useState<Kind>(initialKind),[reason,setReason]=useState(initialNoticeBody?`Disputing: "${initialNoticeBody}"`:"");
 const [asking,setAsking]=useState(Boolean(initialApplicationId||initialOfferId||initialNoticeBody));
 const [target,setTarget]=useState(initialKind==="OFFER_ACCEPTANCE_DISPUTE"?initialOfferId:initialApplicationId),[aux,setAux]=useState(initialRoundId),[proofUrl,setProofUrl]=useState("");
 const [consent,setConsent]=useState(false),[notice,setNotice]=useState(""),[error,setError]=useState("");
 const [discardOpen,setDiscardOpen]=useState(false),[afterDiscardKind,setAfterDiscardKind]=useState<Kind|null>(null);
 const reasonRef=useRef<HTMLTextAreaElement|null>(null);
 const dirty=reason.trim().length>0||target.trim().length>0||
  aux.trim().length>0||proofUrl.trim().length>0||consent;
 const resetDraft=()=>{
  setReason("");setTarget("");setAux("");setProofUrl("");setConsent(false);
  setNotice("");setError("");
 };
 const cancelDraft=()=>{if(pending)return;if(dirty)setDiscardOpen(true);else{resetDraft();setAsking(false);}};
 const {run,pending}=useGuardedAction();
 const refresh=useCallback(async (pageNumber:number)=>{
  const generation=++historyGeneration.current;
  setHistoryLoading(true);
  try{
   const params=new URLSearchParams({page:String(pageNumber),pageSize:"20"});
   const data=await apiFetch<{
    requests:History[];cohortId:string|null;total:number;totalPages:number;
   }>("/api/placements/requests/general?"+params.toString(),{cache:"no-store"});
   if(generation!==historyGeneration.current)return;
   if(!Array.isArray(data.requests)||!Number.isSafeInteger(data.total)||data.total<0||
    !Number.isSafeInteger(data.totalPages)||data.totalPages<1)
    throw new Error("Invalid personal request history");
   setHistoryTotal(data.total);setHistoryTotalPages(data.totalPages);
   setCohortId(data.cohortId??"");
   if(pageNumber>data.totalPages){setHistoryPage(data.totalPages);return;}
   setRows(data.requests);setHistoryError("");
  }catch{
   if(generation===historyGeneration.current){
    setRows([]);
    setHistoryError("Request history could not be loaded. Try refreshing.");
   }
  }finally{
   if(generation===historyGeneration.current)setHistoryLoading(false);
  }
 },[]);
 useEffect(()=>{
  void Promise.resolve().then(()=>refresh(historyPage));
  return ()=>{historyGeneration.current++;};
 },[historyPage,refresh]);
 const payload=()=>{
  switch(kind){
   case "OFF_CAMPUS_OFFER":return {kind,reason,companyName:target,ctcLpa:aux.trim()||null,proofUrl};
   case "REGISTRATION_CHANGE":return {kind,reason,cohortId,choice:target||"HIGHER_STUDIES",consentConfirmed:consent};
   case "ABSENCE_DISPUTE":return {kind,reason,applicationId:target,roundId:aux,proofUrl};
   case "CORRECTION_WITH_PROOF":return {kind,reason,section:"EDUCATION" as const,field:target,proposedValue:aux,proofUrl};
   case "OFFER_ACCEPTANCE_DISPUTE":return {kind,reason,offerId:target};
   case "PLACEMENT_AFTER_PLACEMENT":return {kind,reason,requestedJobId:target,justification:aux};
  }
 };
 async function submit(){
  if(reason.trim().length<3){
   setError("Please explain");reasonRef.current?.focus();return;
  }
  if(kind==="REGISTRATION_CHANGE"&&
    !["PLACEMENTS","HIGHER_STUDIES","NOT_INTERESTED"].includes(target||"HIGHER_STUDIES")){
   setError("Choose one of the three learner registration options.");return;
  }
  const parsed=tpoGeneralRequestInputSchema.safeParse(payload());
  if(!parsed.success){
   const issue=parsed.error.issues[0];
   setError(issue?.message||"Complete the required details for this request before sending.");
   if(issue?.path.includes("reason"))reasonRef.current?.focus();
   return;
  }
  setError("");setNotice("");
  try{
   await run(async()=>{
    await apiFetch("/api/placements/requests/general",{method:"POST",credentials:"same-origin",
     headers:{"content-type":"application/json"},body:JSON.stringify(parsed.data)});
    resetDraft();setAsking(false);
    setNotice("Sent to the placement cell");
    if(historyPage===1)await refresh(1);
    else setHistoryPage(1);
   });
  }catch{setError("The request could not be sent. Your entered details are still here; please retry.");}
 }
 return <section aria-labelledby="learner-general-requests-title" className="min-w-0 space-y-4 border-b border-border pb-5">
  <div className="flex flex-wrap items-center justify-between gap-3">
   <h2 id="learner-general-requests-title" className="text-lg font-semibold">Your requests</h2>
   <Button type="button" size="sm" disabled={pending} onClick={()=>{resetDraft();setAsking(true);}}>New request</Button>
  </div>
  <Dialog open={asking} title="New request" dismissible={!pending}
   onOpenChange={open=>{if(open)setAsking(true);else cancelDraft();}}
   footer={<>
    <Button type="button" variant="secondary" disabled={pending} onClick={cancelDraft}>Cancel</Button>
    <Button type="button" disabled={pending} loading={pending} onClick={()=>void submit()}>{pending?"Sending…":"Send"}</Button>
   </>}>
  <div className="space-y-4">
  <p className="text-sm">Tell your placement cell about an off-campus offer, registration change, disputed absence, record correction or a request to apply after placement.</p>
  <label className="grid gap-[6px] text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">What do you need?<Select className={box} disabled={pending} value={kind}
   onChange={e=>{
    if(pending)return;
    if(dirty){setAfterDiscardKind(e.target.value as Kind);setError("");setDiscardOpen(true);return;}
    setKind(e.target.value as Kind);resetDraft();
   }}>
   {kinds.map(([id,name])=><option key={id} value={id}>{name}</option>)}
  </Select></label>
  {kind==="REGISTRATION_CHANGE"?<label className="grid gap-[6px] text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">Change to
   <Select className={box} value={target||"HIGHER_STUDIES"} onChange={e=>setTarget(e.target.value)}>
    {([["PLACEMENTS","Placements"],["HIGHER_STUDIES","Higher studies"],["NOT_INTERESTED","Not interested"]] as const).map(([key,label])=>
     <option key={key} value={key}>{label}</option>)}
   </Select>
  </label>:
   <label className="grid gap-[6px] text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">{kind==="OFF_CAMPUS_OFFER"?"Company":
    kind==="ABSENCE_DISPUTE"?"Application ID":kind==="OFFER_ACCEPTANCE_DISPUTE"?"Offer ID":kind==="CORRECTION_WITH_PROOF"?"Record field":"Requested drive ID"}
    <Input className={box} maxLength={kind==="OFF_CAMPUS_OFFER"?200:kind==="CORRECTION_WITH_PROOF"?140:200} placeholder={kind==="OFF_CAMPUS_OFFER"?"e.g. Acme Corp":undefined} value={target} onChange={e=>setTarget(e.target.value)}/>
   </label>}
  {kind!=="REGISTRATION_CHANGE"&&kind!=="OFFER_ACCEPTANCE_DISPUTE"?<label className="grid gap-[6px] text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">
   {kind==="OFF_CAMPUS_OFFER"?"CTC (LPA, optional)":
    kind==="ABSENCE_DISPUTE"?"Round ID":kind==="CORRECTION_WITH_PROOF"?"Corrected value":"Justification"}
   <Input className={box} type={kind==="OFF_CAMPUS_OFFER"?"number":"text"} min={kind==="OFF_CAMPUS_OFFER"?0:undefined} step={kind==="OFF_CAMPUS_OFFER"?0.01:undefined} placeholder={kind==="OFF_CAMPUS_OFFER"?"e.g. 8.5":undefined} maxLength={1000} value={aux} onChange={e=>setAux(e.target.value)}/>
  </label>:target==="PLACEMENTS"?<label className="flex min-h-11 min-w-0 items-start gap-2 py-2 text-sm">
   <Checkbox checked={consent} onChange={e=>setConsent(e.target.checked)}/>
   I request placement registration and consent to the placement rules.
  </label>:null}
  {["OFF_CAMPUS_OFFER","ABSENCE_DISPUTE","CORRECTION_WITH_PROOF"].includes(kind)?<div
   className="min-w-0 space-y-2 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface p-3">
   <div className="flex items-center gap-2 text-sm font-semibold text-body">
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
     <path d="M7 18V7a5 5 0 0 1 10 0v11a3 3 0 0 1-6 0V8a1 1 0 0 1 2 0v8"/>
    </svg> Offer letter
   </div>
   <FileUpload label="Attach a proof file" accept=".pdf,.png,.jpg,.jpeg"
    onFiles={()=>{}} pickerUnavailable showSelectedFiles
    helper="Signed, learner-scoped storage has not been enabled for placement requests. A file is not attached until verified by the server."
    fallback={<p role="status" className="text-xs text-body">
      Use the HTTPS proof link below, or share the letter with your placement cell separately.
      A local file picker cannot upload an unverified or publicly exposed document.
    </p>}/>
   <label className="grid gap-[6px] text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">Proof link (HTTPS)
   <Input className={box} type="url" placeholder="https://..." maxLength={2000} value={proofUrl}
     onChange={e=>{setProofUrl(e.target.value);setNotice("");setError("");}}/>
  </label>
  {proofUrl.trim()?<p role="status" className="text-xs text-body">
    Proof link supplied. The placement cell will review access and authenticity; no file has been uploaded.
  </p>:null}
 </div>:null}
  <label className="grid gap-[6px] text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">Tell the placement cell why
   <Textarea ref={reasonRef} className={box} rows={3} maxLength={900} value={reason} onChange={e=>{setReason(e.target.value);setError("");}} aria-invalid={error==="Please explain"} aria-describedby={error==="Please explain"?"learner-general-requests-error":undefined}/>
  </label>
  {error?<p role="alert" id="learner-general-requests-error" className="text-sm text-error">{error}</p>:null}
  </div>
  </Dialog>
  <ConfirmDialog open={discardOpen} onOpenChange={open=>{setDiscardOpen(open);if(!open)setAfterDiscardKind(null);}} title="Discard this request?"
   description="Your unsent request details, any proof link and registration choice will be lost."
   confirmLabel="Discard request" confirmVariant="danger"
   onConfirm={()=>{resetDraft();if(afterDiscardKind)setKind(afterDiscardKind);else setAsking(false);setAfterDiscardKind(null);setDiscardOpen(false);}}>
   <p className="text-sm text-body">Changes to this request have not been sent to the placement cell.</p>
  </ConfirmDialog>
  {notice?<p role="status" className="text-sm">{notice}</p>:null}
  <h3 id="learner-general-requests-history" className="sr-only">Request history</h3>
  {historyLoading?<p role="status" className="text-sm">Loading request history…</p>:
   historyError?<div role="alert" className="flex flex-wrap items-center gap-3 text-sm">
    <span>{historyError}</span>
    <Button type="button" variant="secondary" disabled={pending} onClick={()=>void refresh(historyPage)}>Retry</Button>
   </div>:
   !rows.length?<p role="status" className="text-sm">Need more time on an offer, a correction to your details, or to report an off-campus offer? Send a request and the placement cell will reply here.</p>:
   <ul className="divide-y divide-border">{rows.map(row=>{
    const state=requestState[row.status]??{label:row.status.replaceAll("_"," "),tone:"border-[var(--lms-canvas-border)] bg-surface"};
    return <li key={row.id} className="flex min-w-0 flex-wrap justify-between gap-3 border-b border-border py-3 text-sm last:border-b-0">
     <div className="min-w-0 flex-1">
      <strong>{kinds.find(([id])=>id===row.kind)?.[1]??row.kind.replaceAll("_"," ")}</strong>
      <p className="break-words">{row.reason}</p>
      {row.decisionNote?<p className="break-words"><strong>Reply:</strong> {row.decisionNote}</p>:null}
      {row.requestedAt?<p className="text-xs text-muted-foreground">{sentAgo(row.requestedAt)}</p>:null}
     </div>
     <span className={`self-start rounded-full border px-2 py-1 text-xs font-medium ${state.tone}`}>{state.label}</span>
    </li>;
   })}</ul>}
  {historyTotal>0?<nav aria-label="Your request history pages" className="flex flex-wrap items-center justify-between gap-3 text-sm">
   <span role="status">Page {historyPage} of {historyTotalPages} · {historyTotal} requests</span>
   <div className="flex items-center gap-2">
    <Button type="button" variant="secondary" disabled={pending||historyLoading||historyPage<=1}
     onClick={()=>setHistoryPage(page=>Math.max(1,page-1))}>Previous</Button>
    <Button type="button" variant="secondary" disabled={pending||historyLoading||historyPage>=historyTotalPages}
     onClick={()=>setHistoryPage(page=>page+1)}>Next</Button>
   </div>
  </nav>:null}
 </section>;
}

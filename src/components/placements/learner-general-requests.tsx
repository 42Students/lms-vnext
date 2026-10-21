"use client";
import { Checkbox } from "@/components/ui/checkbox";
import {useEffect,useRef,useState} from "react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {Textarea} from "@/components/ui/textarea";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
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
export function LearnerGeneralRequests({
 initialKind="OFF_CAMPUS_OFFER",initialApplicationId="",initialRoundId="",initialOfferId="",
}:{initialKind?:Kind;initialApplicationId?:string;initialRoundId?:string;initialOfferId?:string}){
 const [rows,setRows]=useState<History[]>([]),[cohortId,setCohortId]=useState("");
 const [kind,setKind]=useState<Kind>(initialKind),[reason,setReason]=useState("");
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
 const cancelDraft=()=>{if(pending)return;if(dirty)setDiscardOpen(true);else resetDraft();};
 const {run,pending}=useGuardedAction();
 async function refresh(){
  try{
   const data=await apiFetch<{requests:History[];cohortId:string|null}>("/api/placements/requests/general",{cache:"no-store"});
   setRows(data.requests);setCohortId(data.cohortId??"");
  }catch{setError("Student requests are not available right now. Please retry.");}
 }
 useEffect(()=>{void Promise.resolve().then(refresh);},[]);
 const payload=()=>{
  switch(kind){
   case "OFF_CAMPUS_OFFER":return {kind,reason,companyName:target,ctcLpa:aux,proofUrl};
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
    resetDraft();
    setNotice("Sent to the placement cell");
    await refresh();
   });
  }catch{setError("The request could not be sent. Your entered details are still here; please retry.");}
 }
 return <section aria-label="Other placement requests" className="min-w-0 space-y-4 border-b border-border pb-5">
  <h2 className="text-lg font-semibold">Other placement requests</h2>
  <p className="text-sm">Tell your placement cell about an off-campus offer, registration change, disputed absence, record correction or a request to apply after placement.</p>
  <label className="grid gap-[6px] text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">Request kind<Select className={box} disabled={pending} value={kind}
   onChange={e=>{
    if(pending)return;
    if(dirty){setAfterDiscardKind(e.target.value as Kind);setError("");setDiscardOpen(true);return;}
    setKind(e.target.value as Kind);resetDraft();
   }}>
   {kinds.map(([id,name])=><option key={id} value={id}>{name}</option>)}
  </Select></label>
  {kind==="REGISTRATION_CHANGE"?<label className="grid gap-[6px] text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">New choice
   <Select className={box} value={target||"HIGHER_STUDIES"} onChange={e=>setTarget(e.target.value)}>
    {["HIGHER_STUDIES","PLACEMENTS","NOT_INTERESTED"].map(key=>
     <option key={key} value={key}>{key.replaceAll("_"," ").toLowerCase()}</option>)}
   </Select>
  </label>:
   <label className="grid gap-[6px] text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">{kind==="OFF_CAMPUS_OFFER"?"Company name":
    kind==="ABSENCE_DISPUTE"?"Application ID":kind==="OFFER_ACCEPTANCE_DISPUTE"?"Offer ID":kind==="CORRECTION_WITH_PROOF"?"Record field":"Requested drive ID"}
    <Input className={box} maxLength={kind==="OFF_CAMPUS_OFFER"?150:kind==="CORRECTION_WITH_PROOF"?140:200} value={target} onChange={e=>setTarget(e.target.value)}/>
   </label>}
  {kind!=="REGISTRATION_CHANGE"&&kind!=="OFFER_ACCEPTANCE_DISPUTE"?<label className="grid gap-[6px] text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">
   {kind==="OFF_CAMPUS_OFFER"?"Annual CTC in LPA":
    kind==="ABSENCE_DISPUTE"?"Round ID":kind==="CORRECTION_WITH_PROOF"?"Corrected value":"Justification"}
   <Input className={box} maxLength={1000} value={aux} onChange={e=>setAux(e.target.value)}/>
  </label>:target==="PLACEMENTS"?<label className="flex min-h-11 min-w-0 items-start gap-2 py-2 text-sm">
   <Checkbox checked={consent} onChange={e=>setConsent(e.target.checked)}/>
   I request placement registration and consent to the placement rules.
  </label>:null}
  {["OFF_CAMPUS_OFFER","ABSENCE_DISPUTE","CORRECTION_WITH_PROOF"].includes(kind)?<div
   className="min-w-0 space-y-2 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface p-3">
   <div className="flex items-center gap-2 text-sm font-semibold text-body">
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
     <path d="M7 18V7a5 5 0 0 1 10 0v11a3 3 0 0 1-6 0V8a1 1 0 0 1 2 0v8"/>
    </svg> Offer letter / supporting proof
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
  <label className="grid gap-[6px] text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">Why are you requesting this?
   <Textarea ref={reasonRef} className={box} rows={3} maxLength={999} value={reason} onChange={e=>{setReason(e.target.value);setError("");}} aria-invalid={error==="Please explain"}/>
  </label>
  <div className="flex min-w-0 flex-wrap items-center gap-3">
   <Button className="min-h-11 w-full sm:w-auto md:min-h-9" type="button" disabled={pending} onClick={()=>void submit()}>{pending?"Sending…":"Send request"}</Button>
   <Button variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9" type="button" disabled={pending}
    onClick={cancelDraft}>Cancel</Button>
  </div>
  <ConfirmDialog open={discardOpen} onOpenChange={open=>{setDiscardOpen(open);if(!open)setAfterDiscardKind(null);}} title="Discard this request?"
   description="Your unsent request details, any proof link and registration choice will be lost."
   confirmLabel="Discard request" confirmVariant="danger"
   onConfirm={()=>{resetDraft();if(afterDiscardKind)setKind(afterDiscardKind);setAfterDiscardKind(null);setDiscardOpen(false);}}>
   <p className="text-sm text-body">Changes to this request have not been sent to the placement cell.</p>
  </ConfirmDialog>
  {notice?<p role="status" className="text-sm">{notice}</p>:null}
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  <h3 className="font-semibold">Request history</h3>
  {!rows.length?<p role="status" className="text-sm">No other placement requests recorded yet.</p>:
   <ul className="divide-y divide-border">{rows.map(row=><li key={row.id} className="min-w-0 border-b border-border py-3 text-sm last:border-b-0">
    <strong>{row.kind.replaceAll("_"," ")}</strong> · {row.status.replaceAll("_"," ")}
    <p className="break-words">{row.reason}</p>
    {row.decisionNote?<p>Placement cell: {row.decisionNote}</p>:null}
   </li>)}</ul>}
 </section>;
}

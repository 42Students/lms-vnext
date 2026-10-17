"use client";
import {useEffect,useState} from "react";
import {apiFetch} from "@/lib/api-fetch";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {tpoGeneralRequestInputSchema} from "@/modules/placements/tpo-general-request-model";
type History={id:string;kind:string;status:string;reason:string;requestedAt:string;decisionNote:string|null};
type Kind="OFF_CAMPUS_OFFER"|"REGISTRATION_CHANGE"|"ABSENCE_DISPUTE"|"CORRECTION_WITH_PROOF"|"PLACEMENT_AFTER_PLACEMENT";
const kinds:readonly [Kind,string][]=[
 ["OFF_CAMPUS_OFFER","Off-campus offer"],["REGISTRATION_CHANGE","Registration change"],
 ["ABSENCE_DISPUTE","Absence dispute"],["CORRECTION_WITH_PROOF","Correction with proof"],
 ["PLACEMENT_AFTER_PLACEMENT","Placement after placement"]];
const box="min-h-11 rounded border border-border bg-surface p-2";
export function LearnerGeneralRequests({
 initialKind="OFF_CAMPUS_OFFER",initialApplicationId="",initialRoundId="",
}:{initialKind?:Kind;initialApplicationId?:string;initialRoundId?:string}){
 const [rows,setRows]=useState<History[]>([]),[cohortId,setCohortId]=useState("");
 const [kind,setKind]=useState<Kind>(initialKind),[reason,setReason]=useState("");
 const [target,setTarget]=useState(initialApplicationId),[aux,setAux]=useState(initialRoundId),[proofUrl,setProofUrl]=useState("");
 const [consent,setConsent]=useState(false),[notice,setNotice]=useState(""),[error,setError]=useState("");
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
   case "PLACEMENT_AFTER_PLACEMENT":return {kind,reason,requestedJobId:target,justification:aux};
  }
 };
 async function submit(){
  const parsed=tpoGeneralRequestInputSchema.safeParse(payload());
  if(!parsed.success){setError("Complete the required details for this request before sending.");return;}
  setError("");setNotice("");
  try{
   await run(async()=>{
    await apiFetch("/api/placements/requests/general",{method:"POST",credentials:"same-origin",
     headers:{"content-type":"application/json"},body:JSON.stringify(parsed.data)});
    setNotice("Request sent to your placement cell. You can track it below.");
    setReason("");setTarget("");setAux("");setProofUrl("");setConsent(false);
    await refresh();
   });
  }catch{setError("The request could not be sent. Your entered details are still here; please retry.");}
 }
 return <section aria-label="Other placement requests" className="space-y-3 rounded-xl border border-border bg-surface p-4">
  <h2 className="text-lg font-semibold">Other placement requests</h2>
  <p className="text-sm">Tell your placement cell about an off-campus offer, registration change, disputed absence, record correction or a request to apply after placement.</p>
  <label className="grid gap-1 text-sm">Request kind<select className={box} disabled={pending} value={kind}
   onChange={e=>{setKind(e.target.value as Kind);setTarget("");setAux("");setProofUrl("");}}>
   {kinds.map(([id,name])=><option key={id} value={id}>{name}</option>)}
  </select></label>
  {kind==="REGISTRATION_CHANGE"?<label className="grid gap-1 text-sm">New choice
   <select className={box} value={target||"HIGHER_STUDIES"} onChange={e=>setTarget(e.target.value)}>
    {["HIGHER_STUDIES","PLACEMENTS","NOT_INTERESTED","ENTREPRENEURSHIP","COMPETITIVE_EXAMS"].map(key=>
     <option key={key} value={key}>{key.replaceAll("_"," ").toLowerCase()}</option>)}
   </select>
  </label>:
   <label className="grid gap-1 text-sm">{kind==="OFF_CAMPUS_OFFER"?"Company name":
    kind==="ABSENCE_DISPUTE"?"Application ID":kind==="CORRECTION_WITH_PROOF"?"Record field":"Requested drive ID"}
    <input className={box} maxLength={200} value={target} onChange={e=>setTarget(e.target.value)}/>
   </label>}
  {kind!=="REGISTRATION_CHANGE"?<label className="grid gap-1 text-sm">
   {kind==="OFF_CAMPUS_OFFER"?"Annual CTC in LPA":
    kind==="ABSENCE_DISPUTE"?"Round ID":kind==="CORRECTION_WITH_PROOF"?"Corrected value":"Justification"}
   <input className={box} maxLength={1000} value={aux} onChange={e=>setAux(e.target.value)}/>
  </label>:target==="PLACEMENTS"?<label className="flex items-start gap-2 text-sm">
   <input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/>
   I request placement registration and consent to the placement rules.
  </label>:null}
  {["OFF_CAMPUS_OFFER","ABSENCE_DISPUTE","CORRECTION_WITH_PROOF"].includes(kind)?<label className="grid gap-1 text-sm">Proof link (HTTPS)
   <input className={box} type="url" placeholder="https://..." maxLength={2000} value={proofUrl} onChange={e=>setProofUrl(e.target.value)}/>
  </label>:null}
  <label className="grid gap-1 text-sm">Why are you requesting this?
   <textarea className={box} rows={3} maxLength={2000} value={reason} onChange={e=>setReason(e.target.value)}/>
  </label>
  <button type="button" disabled={pending} onClick={()=>void submit()}
   className="min-h-11 rounded bg-primary px-4 font-semibold text-on-primary disabled:opacity-50">{pending?"Sending…":"Send request"}</button>
  {notice?<p role="status" className="text-sm">{notice}</p>:null}
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  <h3 className="font-semibold">Request history</h3>
  {!rows.length?<p role="status" className="text-sm">No other placement requests recorded yet.</p>:
   <ul className="space-y-2">{rows.map(row=><li key={row.id} className="rounded border border-border p-3 text-sm">
    <strong>{row.kind.replaceAll("_"," ")}</strong> · {row.status.replaceAll("_"," ")}
    <p className="break-words">{row.reason}</p>
    {row.decisionNote?<p>Placement cell: {row.decisionNote}</p>:null}
   </li>)}</ul>}
 </section>;
}

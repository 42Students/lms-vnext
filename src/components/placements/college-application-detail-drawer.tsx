"use client";
import {useEffect,useRef,useState} from "react";
import {apiFetch} from "@/lib/api-fetch";
type Event={from:string|null;to:string;reason:string|null;when:string};
export type CollegeApplicationDetail={
 application:{id:string;name:string|null;email:string|null;phone:string|null;
  rollNumber:string|null;role:string;source:string;status:string;submittedAt:string;
  withdrawnAt:string|null;eligibilityStatus:string;eligibilitySnapshot:unknown};
 screening:{status:string;candidateMessage:string|null;internalReason:string|null;
  decidedAt:string|null}|null;
 stage:string|null;stageHistory:Event[];screeningHistory:Event[];history:Event[];
 notes:{id:string;body:string;createdAt:string}[];
 rounds:{id:string;name:string;testUrl:string|null;scheduledAt:string|null}[];
 offers:{id:string;status:string;issuedAt:string;offerLetterUrl:string|null;offerLetterAttachedAt:string|null}[];
 scoring:{available:boolean;reason:string};resume:{available:boolean;reason:string};
};
const when=(v:string)=>new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",
 timeZone:"Asia/Kolkata"}).format(new Date(v));
export function CollegeApplicationDetailDrawer({jobId,applicationId,onClose,initialDetail,basePath="/college/placements"}:{
 jobId:string;applicationId:string;onClose:()=>void;initialDetail?:CollegeApplicationDetail;
 basePath?: "/college/placements"|"/admin/placements";
}){
 const [detail,setDetail]=useState<CollegeApplicationDetail|null>(initialDetail??null);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState("");
 const [note,setNote]=useState("");
 const [letterInput,setLetterInput]=useState<Record<string,string>>({});
 const [saving,setSaving]=useState(false);
 const [savingLetter,setSavingLetter]=useState(false);
 const [success,setSuccess]=useState("");
 const [linkNotice,setLinkNotice]=useState("");
 const errorRef=useRef<HTMLParagraphElement>(null);
 useEffect(()=>{if(error)errorRef.current?.focus();},[error]);
 const url="/api/placements/college/jobs/"+encodeURIComponent(jobId)+"/applications/"+
   encodeURIComponent(applicationId);
 async function reload(){
  setLoading(true);setError("");
  try{
   const body=await apiFetch<CollegeApplicationDetail>(url,{cache:"no-store"});
   if(!body?.application)throw Error("Could not load this application. Please try again.");
   setDetail(body);
  }catch(reason){setError(reason instanceof Error?reason.message:"Unable to load application");}
  finally{setLoading(false);}
 }
 async function save(){
  if(!note.trim()||saving)return;
  setSaving(true);setError("");setSuccess("");
  try{
   await apiFetch(url,{method:"POST",headers:{"content-type":"application/json"},
    body:JSON.stringify({body:note.trim()})});
   setNote("");await reload();setSuccess("Internal note saved to application history.");
  }catch(reason){setError(reason instanceof Error?reason.message:"Note could not be saved");}
  finally{setSaving(false);}
 }
 async function attachLetter(offerId:string){
  if(savingLetter)return;
  const url=letterInput[offerId]?.trim()??"";
  if(!url.startsWith("https://")){setError("Enter a secure HTTPS offer-letter URL.");return;}
  setSavingLetter(true);setError("");setSuccess("");
  try{
   await apiFetch(urlPath(),{method:"PATCH",headers:{"content-type":"application/json"},
    body:JSON.stringify({offerId,url,confirmed:true})});
   await reload();setSuccess("Offer letter attached");
  }catch(reason){setError(reason instanceof Error?reason.message:"Unable to attach offer letter.");}
  finally{setSavingLetter(false);}
 }
 function urlPath(){return url;}
 const sections=[
  {label:"Pipeline history",rows:detail?.stageHistory??[]},
  {label:"Screening history",rows:detail?.screeningHistory??[]},
  {label:"Application history",rows:detail?.history??[]},
 ];
 return <div className="fixed inset-0 z-50 flex justify-end bg-black/50" role="presentation">
  <section role="dialog" aria-modal="true" aria-label="Application Details"
    className="h-full w-full max-w-2xl overflow-y-auto bg-surface p-5 shadow-xl">
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-lg font-semibold">Application Details</h2>
      <div className="flex gap-2">
       <button type="button" onClick={()=>void reload()} disabled={loading}
        className="min-h-10 rounded border border-border px-3 focus-visible:ring-2 focus-visible:ring-primary">Refresh</button>
       <button type="button" onClick={onClose} className="min-h-10 rounded border border-border px-3">Close</button>
      </div>
    </div>
    {!detail&&!loading&&!error?<button type="button" onClick={()=>void reload()}
      className="mt-4 min-h-11 rounded bg-primary px-4 text-on-primary">Open application details</button>:null}
    {loading?<p role="status" className="py-4 text-sm">Loading application details…</p>:null}
    {error?<p ref={errorRef} tabIndex={-1} role="alert" className="my-4 text-sm text-error">{error}</p>:null}
    {detail?<div className="mt-4 space-y-5">
      <div className="rounded-lg border border-border p-4">
       <h3 className="font-semibold">{detail.application.name??"Unnamed learner"} · {detail.application.role}</h3>
       <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <p>Email: {detail.application.email??"Not provided"}</p>
        <p>Mobile: {detail.application.phone??"Not provided"}</p>
        <p>Roll: {detail.application.rollNumber??"Not recorded"}</p>
        <p>Source: {detail.application.source}</p>
        <p>Pipeline: {detail.stage??"Applied"}</p>
        <p>Application: {detail.application.status}</p>
        <p>Applied Date: {when(detail.application.submittedAt)}</p>
        <p>Eligibility: {detail.application.eligibilityStatus}</p>
       </div>
       {detail.screening?<div className="mt-4 border-t border-border pt-3 text-sm">
        <p className="font-semibold">Screening · {detail.screening.status}</p>
        {detail.screening.candidateMessage?<p>Candidate feedback: {detail.screening.candidateMessage}</p>:null}
        {detail.screening.internalReason?<p>Internal screening reason: {detail.screening.internalReason}</p>:null}
       </div>:null}
      </div>
      <section className="rounded-lg border border-border p-4">
       <h3 className="font-semibold">Resume and match score</h3>
       <p className="mt-2 text-sm text-body">{detail.resume.reason}</p>
       <p className="mt-2 text-sm text-body">{detail.scoring.reason}</p>
       <p className="text-xs text-muted-foreground">No invented private document URL or computed match score is shown.</p>
      </section>
      <section className="rounded-lg border border-border p-4">
       <h3 className="font-semibold">Assessment Link</h3>
       {detail.rounds.filter(r=>r.testUrl?.startsWith("https://")).length?
        <div className="mt-3 space-y-2">{detail.rounds.filter(r=>r.testUrl?.startsWith("https://")).map(r=>
          <p key={r.id} className="text-sm"><a href={r.testUrl!} target="_blank"
            rel="noreferrer noopener" className="font-semibold text-primary-text underline">{r.name} · Open assessment</a>
            <span className="mt-1 block break-all text-xs text-muted-foreground">{r.testUrl}</span>
            <button type="button" onClick={async()=>{try{await navigator.clipboard.writeText(r.testUrl!);setLinkNotice("Assessment link copied.");}catch{setLinkNotice("Copy unavailable. Select and copy the link shown above.");}}}
             className="mt-1 min-h-10 rounded border border-border px-3 font-semibold focus-visible:ring-2 focus-visible:ring-primary">Copy assessment link</button></p>)}</div>
        :<p className="mt-2 text-sm text-body">Link shared soon</p>}
      </section>
      {linkNotice?<p role="status" className="text-sm text-body">{linkNotice}</p>:null}
      <section className="rounded-lg border border-border p-4">
       <h3 className="font-semibold">Interview scheduling</h3>
       <a href={basePath+"/jobs/"+encodeURIComponent(jobId)+
        (basePath==="/admin/placements"?"/schedule":"/interviews")+"?applicationId="+encodeURIComponent(applicationId)}
        className="mt-2 inline-flex min-h-10 items-center rounded border border-border px-3 font-semibold text-primary-text">
        Schedule or view candidate interviews
       </a>
      </section>
      <section className="rounded-lg border border-border p-4">
       <h3 className="font-semibold">Offer history</h3>
       {detail.offers.length?<ul className="mt-2 space-y-3 text-sm">{detail.offers.map(o=>
        <li key={o.id} className="space-y-2 rounded border border-border p-2">
         <p>{o.status} · {when(o.issuedAt)}</p>
         {o.offerLetterUrl?<a href={o.offerLetterUrl} target="_blank" rel="noreferrer noopener"
           className="font-semibold text-primary-text underline">View offer letter</a>:null}
         {["ISSUED","ACCEPTED"].includes(o.status)?<div className="space-y-2">
          <label className="grid gap-1">Offer-letter HTTPS link
           <input type="url" placeholder="https://..." value={letterInput[o.id]??""}
            onChange={e=>setLetterInput(prev=>({...prev,[o.id]:e.target.value}))}
            className="min-h-10 rounded border border-border bg-surface p-2"/>
          </label>
          <button type="button" disabled={savingLetter} onClick={()=>void attachLetter(o.id)}
           className="min-h-10 rounded border border-border px-3 font-semibold text-primary-text disabled:opacity-50">
           {savingLetter?"Saving…":"Attach Offer Letter"}</button>
         </div>:null}
        </li>)}</ul>:
        <p className="mt-2 text-sm text-body">No issued offers.</p>}
      </section>
      <section className="rounded-lg border border-border p-4">
       <h3 className="font-semibold">Internal Notes</h3>
       <p className="mt-1 text-xs text-muted-foreground">Visible only to the college placement team; notes are append-only.</p>
       <div className="mt-3 max-h-48 space-y-2 overflow-auto">{detail.notes.map(n=>
        <div key={n.id} className="rounded border border-border p-2 text-sm">
         <p>{n.body}</p><p className="mt-1 text-xs text-muted-foreground">{when(n.createdAt)}</p>
        </div>)}</div>
       <label className="mt-3 grid gap-2 text-sm font-semibold">Add internal notes (visible only to admins)
        <textarea rows={3} maxLength={2000} value={note} onChange={e=>setNote(e.target.value)}
         className="rounded border border-border bg-surface p-3"/></label>
       {success?<p role="status" className="text-sm text-body">{success}</p>:null}
       <button type="button" disabled={saving||!note.trim()} onClick={()=>void save()}
        className="mt-3 min-h-10 rounded bg-primary px-4 font-semibold text-on-primary disabled:opacity-50">
         {saving?"Saving…":"Add note"}</button>
      </section>
      {sections.map(section=><section key={section.label} className="rounded-lg border border-border p-4">
        <h3 className="font-semibold">{section.label}</h3>
        {section.rows.length?<ol className="mt-3 space-y-2 text-sm">{section.rows.map((event,index)=>
          <li key={index} className="rounded border border-border p-2">
           {event.from??"New"} → {event.to} · {when(event.when)}
           {event.reason?<p className="mt-1 text-xs text-body">{event.reason}</p>:null}
          </li>)}</ol>:<p className="mt-2 text-sm text-body">No recorded events.</p>}
      </section>)}
    </div>:null}
  </section>
 </div>;
}

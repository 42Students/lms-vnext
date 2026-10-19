"use client";
import {Dialog} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
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
 scoring:{available:boolean;reason:string};resume:{available:boolean;reason:string;url:string|null};
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
 const [amendsNoteId,setAmendsNoteId]=useState<string|null>(null);
 const [letterInput,setLetterInput]=useState<Record<string,string>>({});
 const [saving,setSaving]=useState(false);
 const [savingLetter,setSavingLetter]=useState(false);
 const [rescreening,setRescreening]=useState(false);
 const [rescreenResult,setRescreenResult]=useState<{
  status:string;checks:Array<{criterion:string;status:string;detail:string;
   actual:string|number|null;required:string|number}>;reviewedAt:string;
 }|null>(null);
 const [success,setSuccess]=useState("");
 const [linkNotice,setLinkNotice]=useState("");
 const errorRef=useRef<HTMLParagraphElement>(null);
 useEffect(()=>{if(error)errorRef.current?.focus();},[error]);
 const endpoint="/api/placements/college/jobs/"+encodeURIComponent(jobId)+"/applications/"+
   encodeURIComponent(applicationId);
 async function reload(){
  setLoading(true);setError("");
  try{
   const body=await apiFetch<CollegeApplicationDetail>(endpoint,{cache:"no-store"});
   if(!body?.application)throw Error("Could not load this application. Please try again.");
   setDetail(body);
  }catch(reason){setError(reason instanceof Error?reason.message:"Unable to load application");}
  finally{setLoading(false);}
 }
 async function save(){
  if(!note.trim()||saving)return;
  setSaving(true);setError("");setSuccess("");
  try{
   await apiFetch(endpoint,{method:"POST",headers:{"content-type":"application/json"},
    body:JSON.stringify({body:note.trim(),...(amendsNoteId?{amendsNoteId}:{})})});
   setNote("");setAmendsNoteId(null);await reload();setSuccess(amendsNoteId?"Notes updated":"Internal note saved to application history.");
  }catch(reason){setError(reason instanceof Error?reason.message:"Note could not be saved");}
  finally{setSaving(false);}
 }
 async function attachLetter(offerId:string){
  if(savingLetter)return;
  const url=letterInput[offerId]?.trim()??"";
  if(!url.startsWith("https://")){setError("Enter a secure HTTPS offer-letter URL.");return;}
  setSavingLetter(true);setError("");setSuccess("");
  try{
   await apiFetch(endpoint,{method:"PATCH",headers:{"content-type":"application/json"},
    body:JSON.stringify({offerId,url,confirmed:true})});
   await reload();setSuccess("Offer letter attached");
  }catch(reason){setError(reason instanceof Error?reason.message:"Unable to attach offer letter.");}
  finally{setSavingLetter(false);}
 }
 async function rescreen(){
  if(rescreening)return;
  setRescreening(true);setError("");setSuccess("");
  try{
   const result=await apiFetch<{status:string;checks:Array<{
    criterion:string;status:string;detail:string;actual:string|number|null;required:string|number;
   }>;reviewedAt:string}>(endpoint+"/rescreen",{
    method:"POST",headers:{"content-type":"application/json"},
    body:JSON.stringify({confirmed:true}),
   });
   setRescreenResult(result);setSuccess("Application re-screened");
  }catch(reason){setError(reason instanceof Error?reason.message:"Unable to re-screen this application.");}
  finally{setRescreening(false);}
 }
 const sections=[
  {label:"Pipeline history",rows:detail?.stageHistory??[]},
  {label:"Screening history",rows:detail?.screeningHistory??[]},
  {label:"Application history",rows:detail?.history??[]},
 ];
 return <Dialog open={true} onOpenChange={open=>{if(!open)onClose();}} title="Application Details">
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-lg font-semibold">Application Details</h2>
      <div className="flex gap-2">
       <Button variant="secondary" type="button" onClick={()=>void reload()} disabled={loading}
        >Refresh</Button>
       <Button variant="secondary" type="button" onClick={onClose} >Close</Button>
      </div>
    </div>
    {!detail&&!loading&&!error?<Button variant="primary" type="button" onClick={()=>void reload()}
      className="mt-4">Open application details</Button>:null}
    {loading?<p role="status" className="py-4 text-sm">Loading application details…</p>:null}
    {error?<p ref={errorRef} tabIndex={-1} role="alert" className="my-4 text-sm text-error">{error}</p>:null}
    {detail?<div className="mt-4 space-y-5">
      <div className="border-b border-border py-4">
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
      <section className="border-b border-border py-4">
       <h3 className="font-semibold">Resume and match score</h3>
       <p className="mt-2 text-sm text-body">{detail.resume.reason}</p>
       {detail.resume.available&&detail.resume.url?
        <a href={detail.resume.url}  rel="noopener noreferrer"
          className="mt-2 inline-flex min-h-11 items-center rounded border border-border px-3 font-semibold text-[var(--lms-teal-deep)]">
          Resume Preview · Open securely
        </a>:null}
       <p className="mt-2 text-sm text-body">{detail.scoring.reason}</p>
       <p className="text-xs text-muted-foreground">The private document endpoint checks access again. No fabricated public resume URL or match score is shown.</p>
       <Button variant="secondary" type="button" disabled={rescreening||detail.application.status!=="SUBMITTED"}
        onClick={()=>void rescreen()}
        className="mt-3">
        {rescreening?"Re-screening…":"Re-screen"}
       </Button>
       <p className="mt-1 text-xs text-muted-foreground">Re-screen checks recorded academic eligibility under current policy. It does not fabricate a match score or reverse an existing screening decision.</p>
       {rescreenResult?<div role="status" className="mt-3 space-y-2 rounded-[var(--lms-control-radius)] border border-border p-3">
        <p className="font-semibold">Current eligibility: {rescreenResult.status}</p>
        {rescreenResult.checks.length?<ul className="space-y-1 text-sm">
         {rescreenResult.checks.map((check,i)=><li key={i}>
          {check.criterion}: {check.status} · {check.detail}
         </li>)}</ul>:<p>No individual policy checks were recorded.</p>}
        <p className="text-xs text-muted-foreground">Reviewed {when(rescreenResult.reviewedAt)}</p>
       </div>:null}
      </section>
      <section className="border-b border-border py-4">
       <h3 className="font-semibold">Assessment Link</h3>
       {detail.rounds.filter(r=>r.testUrl?.startsWith("https://")).length?
        <div className="mt-3 space-y-2">{detail.rounds.filter(r=>r.testUrl?.startsWith("https://")).map(r=>
          <p key={r.id} className="text-sm"><a href={r.testUrl!} 
            rel="noreferrer noopener" className="font-semibold text-[var(--lms-teal-deep)] underline">{r.name} · Open assessment</a>
            <span className="mt-1 block break-all text-xs text-muted-foreground">{r.testUrl}</span>
            <Button variant="secondary" type="button" onClick={async()=>{try{await navigator.clipboard.writeText(r.testUrl!);setLinkNotice("Assessment link copied.");}catch{setLinkNotice("Copy unavailable. Select and copy the link shown above.");}}}
             className="mt-1">Copy assessment link</Button></p>)}</div>
        :<p className="mt-2 text-sm text-body">Link shared soon</p>}
      </section>
      {linkNotice?<p role="status" className="text-sm text-body">{linkNotice}</p>:null}
      <section className="border-b border-border py-4">
       <h3 className="font-semibold">Interview scheduling</h3>
       <a href={basePath+"/jobs/"+encodeURIComponent(jobId)+
        (basePath==="/admin/placements"?"/schedule":"/interviews")+"?applicationId="+encodeURIComponent(applicationId)}
        className="mt-2 inline-flex min-h-11 items-center rounded border border-border px-3 font-semibold text-[var(--lms-teal-deep)]">
        Schedule or view candidate interviews
       </a>
      </section>
      <section className="border-b border-border py-4">
       <h3 className="font-semibold">Offer history</h3>
       {detail.offers.length?<ul className="mt-2 space-y-3 text-sm">{detail.offers.map(o=>
        <li key={o.id} className="space-y-2 rounded border border-border p-2">
         <p>{o.status} · {when(o.issuedAt)}</p>
         {o.offerLetterUrl?<a href={o.offerLetterUrl}  rel="noreferrer noopener"
           className="font-semibold text-[var(--lms-teal-deep)] underline">View offer letter</a>:null}
         {["ISSUED","ACCEPTED"].includes(o.status)?<div className="space-y-2">
          <label className="grid gap-1">Offer-letter HTTPS link
           <Input type="url" placeholder="https://..." value={letterInput[o.id]??""}
            onChange={e=>setLetterInput(prev=>({...prev,[o.id]:e.target.value}))}
            />
          </label>
          <Button variant="secondary" type="button" disabled={savingLetter} onClick={()=>void attachLetter(o.id)}
           >
           {savingLetter?"Saving…":"Attach Offer Letter"}</Button>
         </div>:null}
        </li>)}</ul>:
        <p className="mt-2 text-sm text-body">No issued offers.</p>}
      </section>
      <section className="border-b border-border py-4">
       <h3 className="font-semibold">Internal Notes</h3>
       <p className="mt-1 text-xs text-muted-foreground">Visible only to the college placement team; correcting a note adds a new version and preserves its history.</p>
       {detail.notes.length>3?<p id="application-notes-scroll-cue" className="mt-2 text-xs text-muted-foreground">More internal notes below ↓</p>:null}
       <div tabIndex={0} role="region" aria-label="Internal notes history"
        aria-describedby={detail.notes.length>3?"application-notes-scroll-cue":undefined}
        className="mt-3 max-h-48 space-y-2 overflow-y-auto overscroll-contain pb-5 [mask-image:linear-gradient(to_bottom,#000_0%,#000_calc(100%-1.25rem),transparent_100%)]">{detail.notes.map(n=>
        <div key={n.id} className="border-b border-border py-2 text-sm">
         <p>{n.body}</p><p className="mt-1 text-xs text-muted-foreground">{when(n.createdAt)}</p>
         <Button variant="secondary" type="button" onClick={()=>{setAmendsNoteId(n.id);setNote(n.body);setSuccess("");}}
          className="mt-1">
          Edit Internal Notes
         </Button>
        </div>)}</div>
       <label className="mt-3 grid gap-2 text-sm font-semibold">{amendsNoteId?"Correct internal note":"Add internal notes (visible only to admins)"}
        <Textarea rows={3} maxLength={2000} value={note} onChange={e=>setNote(e.target.value)}
         className="w-full"/></label>
       {success?<p role="status" className="text-sm text-body">{success}</p>:null}
       <Button variant="primary" type="button" disabled={saving||!note.trim()} onClick={()=>void save()}
        className="mt-3">
         {saving?"Saving…":amendsNoteId?"Save correction":"Add note"}</Button>
       {amendsNoteId?<Button variant="secondary" type="button" onClick={()=>{setAmendsNoteId(null);setNote("");}}
         className="ml-2">Cancel correction</Button>:null}
      </section>
      {sections.map(section=><section key={section.label} className="border-b border-border py-4">
        <h3 className="font-semibold">{section.label}</h3>
        {section.rows.length?<ol className="mt-3 space-y-2 text-sm">{section.rows.map((event,index)=>
          <li key={index} className="rounded border border-border p-2">
           {event.from??"New"} → {event.to} · {when(event.when)}
           {event.reason?<p className="mt-1 text-xs text-body">{event.reason}</p>:null}
          </li>)}</ol>:<p className="mt-2 text-sm text-body">No recorded events.</p>}
      </section>)}
    </div>:null}
 </Dialog>;
}

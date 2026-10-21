"use client";
import {Dialog} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {useToast} from "@/components/ui/toast";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {Disclosure} from "@/components/ui/disclosure";
import {useEffect,useRef,useState} from "react";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {CollegeInterviewAppointments} from "./college-interview-appointments";
type Event={from:string|null;to:string;reason:string|null;when:string};
type CandidateInterviews={
 rounds:Array<{id:string;name:string;status:string;kind:string}>;
 candidates:Array<{applicationId:string;name:string|null;screening:string}>;
 interviews:Array<{id:string;roundId:string;applicationId:string;status:string;scheduledAt:string;
 durationMinutes:number;mode:string;venue:string|null;meetingUrl:string|null;
 interviewer:string|null;outcomeNote:string|null;version:number}>;
 appointmentTotal:number;
};
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
 const {showToast}=useToast();
 const [detail,setDetail]=useState<CollegeApplicationDetail|null>(initialDetail??null);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState("");
 const [note,setNote]=useState("");
 const [noteError,setNoteError]=useState("");
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
 const [resumePreviewOpen,setResumePreviewOpen]=useState(false);
 const [interviewOpen,setInterviewOpen]=useState(false);
 const [interviewLoading,setInterviewLoading]=useState(false);
 const [interviewError,setInterviewError]=useState("");
 const [interviewData,setInterviewData]=useState<CandidateInterviews|null>(null);
 const interviewFetchRef=useRef(false);
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
  setSaving(true);setError("");setNoteError("");setSuccess("");
  try{
   if(amendsNoteId&&detail){
    // The append-only correction history is not a mutable JobApplication
    // version. Refuse a stale editor before writing a new correction record.
    const live=await apiFetch<CollegeApplicationDetail>(endpoint,{cache:"no-store"});
    const latestKnown=detail.notes[0];
    const latestLive=live.notes[0];
    if(!live.notes.some(item=>item.id===amendsNoteId)||
       latestKnown?.id!==latestLive?.id||
       latestKnown?.createdAt!==latestLive?.createdAt){
      setDetail(live);
      setNoteError("These notes were updated by someone else. Please refresh and try again.");
      return;
    }
   }
   await apiFetch(endpoint,{method:"POST",headers:{"content-type":"application/json"},
    body:JSON.stringify({body:note.trim(),...(amendsNoteId?{amendsNoteId}:{})})});
   setNote("");setAmendsNoteId(null);await reload();setSuccess("Notes updated");
   showToast({tone:"success",title:"Notes updated"});
  }catch(reason){
   const explanation=reason instanceof Error?reason.message:"Please retry.";
   setNoteError(reason instanceof FriendlyFetchError&&reason.status===409?
    "These notes were updated by someone else. Please refresh and try again.":
    "Notes were not saved. "+explanation);
  }
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
   showToast({tone:"success",title:"Offer letter attached"});
  }catch(reason){setError(reason instanceof Error?reason.message:"Unable to attach offer letter.");}
  finally{setSavingLetter(false);}
 }
 async function loadCandidateInterviews(){
  if(interviewFetchRef.current)return;
  interviewFetchRef.current=true;
  setInterviewLoading(true);setInterviewError("");
  try{
   const data=await apiFetch<CandidateInterviews>(
    "/api/placements/college/jobs/"+encodeURIComponent(jobId)+"/interviews",
    {cache:"no-store"});
   if(!Array.isArray(data.rounds)||!Array.isArray(data.candidates)||
      !Array.isArray(data.interviews))throw Error("Invalid interview response.");
   setInterviewData(data);
  }catch(reason){
   setInterviewError(reason instanceof Error?reason.message:"Failed to load interviews");
  }finally{interviewFetchRef.current=false;setInterviewLoading(false);}
 }
 async function openCandidateInterviews(){
  setInterviewOpen(true);
  await loadCandidateInterviews();
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
 // Only a verified, same-origin private document endpoint can be embedded.
 // The endpoint performs an independent authorization check.
 const privateResumeUrl=detail?.resume.available &&
  /^\/api\/(college|admin|tpo)\/verification\//.test(detail.resume.url??"")
   ? detail.resume.url : null;
 const sections=[
  {label:"Pipeline history",rows:detail?.stageHistory??[]},
  {label:"Screening history",rows:detail?.screeningHistory??[]},
  {label:"Application history",rows:detail?.history??[]},
 ];
 return <>
  <Dialog open={!interviewOpen} onOpenChange={open=>{if(!open)onClose();}} title="Application Details">
    <div className="flex min-w-0 items-center justify-end gap-3">
       <Button variant="secondary" type="button" onClick={()=>void reload()} disabled={loading}
        className="min-h-11 w-full sm:w-auto md:min-h-9">Refresh</Button>
    </div>
    {!detail&&!loading&&!error?<Button variant="primary" type="button" onClick={()=>void reload()}
      className="mt-4">Open application details</Button>:null}
    {loading?<p role="status" className="py-4 text-sm">Loading application details…</p>:null}
    {error?<p ref={errorRef} tabIndex={-1} role="alert" className="my-4 text-sm text-error">{error}</p>:null}
    {detail?<div className="mt-4 min-w-0 space-y-6">
      <div className="border-b border-border py-4">
       <h3 className="font-semibold">{detail.application.name??"Unnamed learner"} · {detail.application.role}</h3>
       <div className="mt-3 grid min-w-0 gap-x-4 gap-y-2 text-sm sm:grid-cols-2 [&>p]:min-w-0 [&>p]:break-words [&>p]:[overflow-wrap:anywhere]">
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
       {privateResumeUrl ? (
        <Button variant="secondary" type="button"
         onClick={()=>setResumePreviewOpen(true)}
         className="mt-2 min-h-11 md:min-h-9">
         Resume Preview
        </Button>
       ) : null}
       <p className="mt-2 text-sm text-body">{detail.scoring.reason}</p>
       <p className="text-xs text-muted-foreground">The private document endpoint checks access again. No fabricated public resume URL or match score is shown.</p>
       <Button variant="secondary" type="button" disabled={rescreening||detail.application.status!=="SUBMITTED"}
        onClick={()=>void rescreen()}
        className="mt-3">
        {rescreening?"Re-screening…":"Re-screen"}
       </Button>
       <p className="mt-1 text-xs text-muted-foreground">Re-screen checks recorded academic eligibility under current policy. It does not fabricate a match score or reverse an existing screening decision.</p>
       {rescreenResult?<div role="status" className="mt-3 space-y-2 border-y border-border py-3">
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
            <Button variant="secondary" type="button" onClick={async()=>{try{
              await navigator.clipboard.writeText(r.testUrl!);
              setLinkNotice("Assessment link copied to clipboard");
              showToast({tone:"success",title:"Assessment link copied to clipboard"});
             }catch{
              setLinkNotice("Failed to copy");
              showToast({tone:"error",title:"Failed to copy",description:"Select and copy the link shown above."});
             }}}
             className="mt-1">Copy assessment link</Button></p>)}</div>
        :<p className="mt-2 text-sm text-body">Link shared soon</p>}
      </section>
      {linkNotice?<p role="status" className="text-sm text-body">{linkNotice}</p>:null}
      <section className="border-b border-border py-4">
       <h3 className="font-semibold">Interview scheduling</h3>
       <p className="mt-1 text-sm text-body">Schedule or edit an interview, record completed/no-show feedback, notify the learner and download a calendar invitation.</p>
       <div className="mt-3 flex flex-wrap gap-3">
        <Button type="button" variant="secondary" onClick={()=>void openCandidateInterviews()}>
         Manage candidate interviews
        </Button>
        <a href={basePath+"/jobs/"+encodeURIComponent(jobId)+
         (basePath==="/admin/placements"?"/schedule":"/interviews")+"?applicationId="+encodeURIComponent(applicationId)}
         className="inline-flex min-h-11 items-center font-semibold text-[var(--lms-teal-deep)] underline md:min-h-9 text-sm">
         Full interview schedule
        </a>
       </div>
      </section>
      <section className="border-b border-border py-4">
       <h3 className="font-semibold">Offer history</h3>
       {detail.offers.length?<ul className="mt-2 divide-y divide-border border-y border-border text-sm">{detail.offers.map(o=>
        <li key={o.id} className="min-w-0 space-y-2 break-words py-3">
         <p>{o.status} · {when(o.issuedAt)}</p>
         {o.offerLetterUrl?<a href={o.offerLetterUrl}  rel="noreferrer noopener"
           className="font-semibold text-[var(--lms-teal-deep)] underline">View offer letter</a>:null}
         {["ISSUED","ACCEPTED"].includes(o.status)?<div className="space-y-2">
          <p className="text-xs text-muted-foreground">Legacy forms accepted HTTP links. For applicant safety, only HTTPS offer-letter links can be attached. This stores the URL on the selected issued or accepted offer without changing its status.</p>
          <label className="grid gap-2 text-[13px] text-body font-semibold leading-4">Offer-letter HTTPS link
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
        className="mt-3 max-h-48 space-y-2 overflow-y-auto overscroll-contain pb-6 [mask-image:linear-gradient(to_bottom,#000_0%,#000_calc(100%-1.25rem),transparent_100%)]">{detail.notes.map(n=>
        <div key={n.id} className="border-b border-border py-2 text-sm">
         <p>{n.body}</p><p className="mt-1 text-xs text-muted-foreground">{when(n.createdAt)}</p>
         <Button variant="secondary" type="button" onClick={()=>{setAmendsNoteId(n.id);setNote(n.body);setSuccess("");}}
          className="mt-1">
          Edit Internal Notes
         </Button>
        </div>)}</div>
       <label className="mt-3 grid gap-2 text-[13px] font-semibold text-body leading-4">{amendsNoteId?"Correct internal note":"Add internal notes (visible only to admins)"}
        <Textarea rows={3} maxLength={2000} value={note} onChange={e=>setNote(e.target.value)}
         className="w-full"/></label>
       {noteError?<p role="alert" className="text-sm text-error">{
        noteError
       }</p>:null}
       {success?<p role="status" className="text-sm text-body">{success}</p>:null}
<div className="mt-3 flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center">
       <Button variant="primary" type="button" disabled={saving||!note.trim()} onClick={()=>void save()}
        className="min-h-11 w-full sm:w-auto md:min-h-9">
         {saving?"Saving…":amendsNoteId?"Save correction":"Add note"}</Button>
       {amendsNoteId?<Button variant="secondary" type="button" onClick={()=>{setAmendsNoteId(null);setNote("");}}
         className="min-h-11 w-full sm:w-auto md:min-h-9">Cancel correction</Button>:null}
</div>
      </section>
      {sections.map(section=><Disclosure key={section.label} title={section.label} className="border-b border-border py-2" contentClassName="pb-3">
        {section.rows.length?<ol className="mt-3 divide-y divide-border text-sm">{section.rows.map((event,index)=>
          <li key={index} className="min-w-0 break-words py-3">
           {event.from??"New"} → {event.to} · {when(event.when)}
           {event.reason?<p className="mt-1 text-xs text-body">{event.reason}</p>:null}
          </li>)}</ol>:<p className="mt-2 text-sm text-body">No recorded events.</p>}
      </Disclosure>)}
    </div>:null}
  </Dialog>
  <Dialog open={interviewOpen} onOpenChange={next=>{if(!next){
    setInterviewOpen(false);void reload();
   }}} title={"Candidate interviews · "+(detail?.application.name??"Applicant")}
   description="Interview actions are recorded against the college drive and notify the candidate."
   className="max-w-[78rem]">
   <div className="space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-3">
     <p className="text-sm text-body">Appointments and calendar invitations are shown in Indian Standard Time.</p>
     <Button type="button" variant="secondary" disabled={interviewLoading}
      onClick={()=>void loadCandidateInterviews()}>
      {interviewLoading?"Loading…":"Refresh interviews"}
     </Button>
    </div>
    {interviewLoading?<p role="status">Loading candidate interviews…</p>:null}
    {interviewError?<div role="alert" className="space-y-2">
      <p className="text-error">Failed to load interviews. {interviewError}</p>
      <Button type="button" variant="secondary" onClick={()=>void loadCandidateInterviews()}>Retry interviews</Button>
     </div>:null}
    {interviewData?<>
     {interviewData.appointmentTotal>interviewData.interviews.length?
      <p role="status" className="text-sm text-warning">The interview list is paginated. Use the full schedule to see appointments outside the current snapshot.</p>:null}
     <CollegeInterviewAppointments jobId={jobId}
      rounds={interviewData.rounds}
      candidates={interviewData.candidates.filter(candidate=>candidate.applicationId===applicationId)}
      appointments={interviewData.interviews.filter(appointment=>appointment.applicationId===applicationId)}
      preferredApplicationId={applicationId} onCommitted={()=>void loadCandidateInterviews()}/>
    </>:null}
    <Button type="button" variant="secondary" onClick={()=>{setInterviewOpen(false);void reload();}}>
     Close candidate interviews
    </Button>
   </div>
  </Dialog>
  <Dialog open={resumePreviewOpen} onOpenChange={setResumePreviewOpen}
   title="Resume Preview"
   description="The verified private document loads through the authorized document endpoint."
   className="max-w-[70rem]">
   {privateResumeUrl ? (
    <div className="min-w-0 space-y-3">
     <iframe title="Verified resume document" src={privateResumeUrl}
      sandbox="allow-downloads" referrerPolicy="no-referrer" loading="lazy"
      className="h-[58vh] w-full rounded-[var(--lms-control-radius)] border border-border bg-white" />
     <p className="text-xs text-muted-foreground">
      If your browser cannot preview this file, use the secure link below.
     </p>
     <a href={privateResumeUrl} target="_blank" rel="noopener noreferrer"
      className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">
      Open verified resume in a new tab
     </a>
     <Button type="button" variant="secondary" onClick={()=>setResumePreviewOpen(false)}
      className="ml-2 min-h-11 md:min-h-9">Close preview</Button>
    </div>
   ) : (
    <p className="text-sm text-body">The verified resume is no longer available.</p>
   )}
  </Dialog>
 </>;
}

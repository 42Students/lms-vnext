"use client";
import {Dialog} from "@/components/ui/dialog";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
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
  withdrawnAt:string|null;statusBeforeWithdrawal?:string|null;
  statusUpdatedAt?:string|null;statusUpdatedByName?:string|null;
  statusUpdatedByUserId?:string|null;papRequested?:boolean|null;
  sourceProvider?:string|null;rejectionReason?:string|null;
  version?:number;eligibilityStatus:string;eligibilitySnapshot:unknown};
 screening:{status:string;candidateMessage:string|null;internalReason:string|null;
  decidedAt:string|null}|null;
 stage:string|null;stageHistory:Event[];screeningHistory:Event[];history:Event[];
 notes:{id:string;body:string;createdAt:string}[];
 rounds:{id:string;name:string;testUrl:string|null;scheduledAt:string|null}[];
 offers:{id:string;status:string;issuedAt:string;offerLetterUrl:string|null;offerLetterAttachedAt:string|null}[];
 scoring:{available:boolean;scorePercent?:number|null;partial?:boolean;reason:string};resume:{available:boolean;reason:string;url:string|null};
};
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
 const [confirmDiscard,setConfirmDiscard]=useState(false);
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
 const detailReadRef=useRef(0);
 const [noteModalOpen,setNoteModalOpen]=useState(false);
 const [confirmNoteDiscard,setConfirmNoteDiscard]=useState(false);
 const [historyError,setHistoryError]=useState<Record<string,string>>({});
 const errorRef=useRef<HTMLParagraphElement>(null);
 useEffect(()=>{if(error)errorRef.current?.focus();},[error]);
 const letterDirty=Object.entries(letterInput).some(([id,url])=>
  url.trim()!==(detail?.offers.find(o=>o.id===id)?.offerLetterUrl??""));
 const dirty=Boolean(note.trim())||letterDirty;
 useEffect(()=>{
  if(!dirty)return;
  const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue="";};
  window.addEventListener("beforeunload",warn);
  return ()=>window.removeEventListener("beforeunload",warn);
 },[dirty]);
 function editNote(id?:string){
  const original=detail?.notes.find(entry=>entry.id===id);
  setNote(original?.body??"");setAmendsNoteId(id??null);
  setNoteError("");setSuccess("");setNoteModalOpen(true);
 }
 function requestNoteClose(){
  if(saving)return;
  const original=detail?.notes.find(entry=>entry.id===amendsNoteId)?.body??"";
  if(note.trim()!==original.trim()){setConfirmNoteDiscard(true);return;}
  setNote("");setAmendsNoteId(null);setNoteModalOpen(false);
 }
 function requestClose(){
  if(saving||savingLetter)return;
  if(dirty)setConfirmDiscard(true);
  else onClose();
 }
 const endpoint="/api/placements/college/jobs/"+encodeURIComponent(jobId)+"/applications/"+
   encodeURIComponent(applicationId);
 async function reload(){
  const requestId=++detailReadRef.current;
  setLoading(true);setError("");
  try{
   const body=await apiFetch<CollegeApplicationDetail>(endpoint,{cache:"no-store"});
   if(!body?.application)throw Error("Could not load this application. Please try again.");
   if(requestId===detailReadRef.current){
    setDetail(body);setHistoryError({});
   }
  }catch(reason){
   if(requestId===detailReadRef.current)
    setError(reason instanceof Error?reason.message:"Unable to load application");
  }finally{if(requestId===detailReadRef.current)setLoading(false);}
 }
 useEffect(()=>{
  setDetail(initialDetail??null);setError("");setNote("");setAmendsNoteId(null);
  setSuccess("");setLinkNotice("");setHistoryError({});
  setRescreenResult(null);setInterviewData(null);setInterviewError("");
  setInterviewOpen(false);setNoteModalOpen(false);setResumePreviewOpen(false);
  if(!initialDetail)void reload();
  return ()=>{detailReadRef.current++;};
  // Route selection, not a re-render of the same route, owns the detail lifetime.
  // eslint-disable-next-line react-hooks/exhaustive-deps
 },[jobId,applicationId]);
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
   setNote("");setAmendsNoteId(null);setNoteModalOpen(false);
   await reload();setSuccess("Notes updated");
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
   await reload();setLetterInput(current=>({...current,[offerId]:url}));setSuccess("Offer letter attached");
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
  <Dialog open={!interviewOpen} onOpenChange={open=>{if(!open)requestClose();}}
   title="Application Details" description="Application details and status history"
   className="max-w-[50rem]" bodyClassName="!px-4 sm:!px-6">
    <div className="flex min-w-0 items-center justify-end gap-3">
       <Button variant="secondary" type="button" onClick={()=>void reload()} disabled={loading}
        className="min-h-11 w-full sm:w-auto md:min-h-9">Refresh</Button>
    </div>
    {!detail&&!loading&&!error?<Button variant="primary" type="button" onClick={()=>void reload()}
      className="mt-4">Open application details</Button>:null}
    {loading?<p role="status" className="py-4 text-sm">Loading application details…</p>:null}
    {error?<p ref={errorRef} tabIndex={-1} role="alert" className="my-4 text-sm text-error">{error}</p>:null}
    {detail?<div className="mt-4 min-w-0 space-y-4">
      <div className="min-w-0 rounded-[8px] border border-[#f0f0f0] px-4 pb-4 pt-2">
       <section className="border-b border-border py-3" aria-labelledby="application-candidate-heading">
        <h3 id="application-candidate-heading" className="text-base font-semibold text-heading">Candidate</h3>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-[11rem_minmax(0,1fr)] [&>dd]:break-words [&>dd]:[overflow-wrap:anywhere]">
         <dt className="font-semibold text-body">Learner Name</dt><dd>{detail.application.name||"-"}</dd>
         <dt className="font-semibold text-body">Email</dt><dd>{detail.application.email||"-"}</dd>
         <dt className="font-semibold text-body">Phone</dt><dd>{detail.application.phone||"-"}</dd>
         <dt className="font-semibold text-body">Roll</dt><dd>{detail.application.rollNumber||"-"}</dd>
         <dt className="font-semibold text-body">Role</dt><dd>{detail.application.role||"-"}</dd>
        </dl>
       </section>
       <section className="py-3" aria-labelledby="application-decision-heading">
        <h3 id="application-decision-heading" className="text-base font-semibold text-heading">Status &amp; decision</h3>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-[11rem_minmax(0,1fr)] [&>dd]:break-words [&>dd]:[overflow-wrap:anywhere]">
         <dt className="font-semibold text-body">Current Status</dt>
         <dd>{detail.stage??detail.application.status}</dd>
         {detail.application.rejectionReason&&(detail.stage==="REJECTED"||detail.screening?.status==="REJECTED")?<>
          <dt className="font-semibold text-body">Rejection feedback</dt>
          <dd className="whitespace-pre-wrap">{detail.application.rejectionReason}</dd>
         </>:null}
         {detail.application.status==="WITHDRAWN"&&detail.application.statusBeforeWithdrawal?<>
          <dt className="font-semibold text-body">Status before withdrawal</dt>
          <dd>{detail.application.statusBeforeWithdrawal}</dd>
         </>:null}
         {detail.application.papRequested!==null&&detail.application.papRequested!==undefined?<>
          <dt className="font-semibold text-body">PAP requested</dt>
          <dd>{detail.application.papRequested?"Yes":"No"}</dd>
         </>:null}
         <dt className="font-semibold text-body">Applied Date</dt>
         <dd>{when(detail.application.submittedAt)}</dd>
         <dt className="font-semibold text-body">Last Updated</dt>
         <dd>{detail.application.statusUpdatedByName?
           detail.application.statusUpdatedByName+" on "+when(detail.application.statusUpdatedAt):
           when(detail.application.statusUpdatedAt??detail.application.submittedAt)}</dd>
         <dt className="font-semibold text-body">Source</dt>
         <dd>{detail.application.sourceProvider??detail.application.source}</dd>
         <dt className="font-semibold text-body">Eligibility</dt>
         <dd>{detail.application.eligibilityStatus}</dd>
        </dl>
       </section>
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
       {detail.scoring.available && typeof detail.scoring.scorePercent === "number" &&
        Number.isFinite(detail.scoring.scorePercent) && detail.scoring.scorePercent >= 0 &&
        detail.scoring.scorePercent <= 100 ? (
        <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">Recorded assessment score</span>
          <span className={"inline-flex rounded-full px-3 py-1 text-sm font-semibold tabular-nums " +
           (detail.scoring.scorePercent >= 70 ? "bg-violet-50 text-violet-700" :
            detail.scoring.scorePercent >= 40 ? "bg-cyan-50 text-cyan-700" :
            "bg-slate-100 text-slate-700")}>
            {Math.round(detail.scoring.scorePercent)}%
            {detail.scoring.partial ? " · Partial" : ""}
          </span>
        </div>
       ) : null}
       <p className="mt-2 text-sm text-body">{detail.scoring.reason}</p>
       <p className="text-xs text-muted-foreground">The private document endpoint checks access again. No public resume URL or automated match score is invented.</p>
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
       <h4 className="font-semibold">Internal Notes</h4>
       <p className="mt-1 text-xs text-muted-foreground">
        Visible only to the college placement team. Edits append a new version so the previous entry remains in history.
       </p>
       <div className="mt-3 flex min-w-0 flex-wrap gap-2">
        <Button variant="secondary" type="button" onClick={()=>editNote()}
         className="min-h-11 md:min-h-9">Add internal notes</Button>
        {detail.internalNoteVersion?<Button variant="secondary" type="button"
          onClick={()=>editNote(detail.internalNoteVersion??undefined)}
          className="min-h-11 md:min-h-9">Edit Internal Notes</Button>:null}
       </div>
       {detail.notes.length>3?<p id="application-notes-scroll-cue" className="mt-2 text-xs text-muted-foreground">More internal notes below ↓</p>:null}
       <div tabIndex={detail.notes.length>3?0:undefined} role="region" aria-label="Internal notes history"
        aria-describedby={detail.notes.length>3?"application-notes-scroll-cue":undefined}
        className="mt-3 max-h-48 space-y-2 overflow-y-auto overscroll-contain pb-6 [mask-image:linear-gradient(to_bottom,#000_0%,#000_calc(100%-1.25rem),transparent_100%)]">
        {detail.notes.map(n=><div key={n.id} className="border-b border-border py-2 text-sm">
          <p className="whitespace-pre-wrap break-words">{n.body}</p>
          <p className="mt-1 text-xs text-muted-foreground">{when(n.createdAt)}</p>
          <Button variant="secondary" type="button" onClick={()=>editNote(n.id)}
            className="mt-1">Edit Internal Notes</Button>
         </div>)}
        {!detail.notes.length?<p className="text-sm text-muted-foreground">No internal notes yet.</p>:null}
       </div>
       {detail.notesHasMore?<p className="mt-2 text-xs text-muted-foreground" role="status">
        Older notes exist beyond the first 100 entries. Open the full application audit log for complete history.
       </p>:null}
       {success?<p role="status" className="mt-2 text-sm text-body">{success}</p>:null}
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
  <Dialog open={noteModalOpen} onOpenChange={next=>{if(!next)requestNoteClose();}}
   title="Edit Internal Notes"
   description="College placement team only. Corrections append a versioned history record rather than overwriting earlier notes."
   className="max-w-[38rem]">
   {amendsNoteId?<p className="text-sm text-body">
     Correcting an existing note. This creates a new audit version and preserves the previous text.
   </p>:null}
   <label className="mt-3 grid gap-2 text-[13px] font-semibold text-body">
    Internal Notes
    <Textarea rows={6} maxLength={2000} disabled={saving} value={note}
     placeholder="Add a factual, staff-only application note"
     onChange={event=>{setNote(event.target.value);setNoteError("");}}
     className="w-full"/>
   </label>
   <p className="mt-1 text-xs text-muted-foreground">{note.length}/2000 characters</p>
   {noteError?<p role="alert" className="mt-2 text-sm text-error">{noteError}</p>:null}
   <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
    <Button variant="secondary" type="button" disabled={saving} onClick={requestNoteClose}>Cancel</Button>
    <Button variant="primary" type="button" disabled={saving||!note.trim()} onClick={()=>void save()}>
     {saving?"Saving…":"Save"}
    </Button>
   </div>
  </Dialog>
  <ConfirmDialog open={confirmNoteDiscard} onOpenChange={setConfirmNoteDiscard}
   title="Discard unsaved internal notes?"
   description="Your changes to the internal note have not been saved."
   confirmLabel="Discard changes" cancelLabel="Keep editing" confirmVariant="danger"
   onConfirm={()=>{setNote("");setAmendsNoteId(null);setNoteModalOpen(false);setConfirmNoteDiscard(false);}}/>
  <ConfirmDialog open={confirmDiscard} onOpenChange={setConfirmDiscard}
    title="Discard unsaved application changes?"
    description="Unsaved offer-letter links and internal notes will be lost."
    confirmLabel="Discard changes" cancelLabel="Keep editing" confirmVariant="danger"
    onConfirm={()=>{setConfirmDiscard(false);onClose();}}/>
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
    {interviewError?<div className="space-y-2">
      <p role="alert" className="text-error">Failed to load interviews. {interviewError}</p>
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

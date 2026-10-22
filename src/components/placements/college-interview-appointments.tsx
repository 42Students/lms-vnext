"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {useToast} from "@/components/ui/toast";
import { Textarea } from "@/components/ui/textarea";
import {DataTable} from "@/components/ui/data-table";
import {Banner} from "@/components/ui/banner";
import {StatusBadge} from "@/components/ui/status-badge";
import {EmptyState} from "@/components/ui/empty-state";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {Dialog} from "@/components/ui/dialog";
import {useEffect,useRef,useState} from "react";
import {usePathname,useRouter} from "next/navigation";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {driveDeadlineIstToIso} from "@/modules/placements/tpo-drive-deadline-ist";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import { Disclosure } from "@/components/ui/disclosure";
import {collegeInterviewIcs} from "@/modules/placements/college-interview-calendar-model";
import {visibleInterviewConflictKinds,visibleInterviewConflictLabel} from "@/modules/placements/interview-visual-conflict-model";
type Round={id:string;name:string;status:string;kind:string};
type Candidate={applicationId:string;name:string|null;screening:string;departmentName?:string|null;rollNumber?:string|null};
type Appointment={id:string;roundId:string;applicationId:string;status:string;scheduledAt:string;
 durationMinutes:number;mode:string;venue:string|null;meetingUrl:string|null;
 interviewer:string|null;outcomeNote:string|null;version:number;
 interviewType?:string|null;roundDescription?:string|null};
const display=(iso:string)=>new Intl.DateTimeFormat("en-IN",{
 dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata",
}).format(new Date(iso))+" IST";
const INTERVIEW_DURATIONS=[15,30,45,60,90,120,180] as const;
const toLocal=(iso:string)=>new Intl.DateTimeFormat("sv-SE",{
 year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",
 hourCycle:"h23",timeZone:"Asia/Kolkata",
}).format(new Date(iso)).replace(" ","T");
export function CollegeInterviewAppointments({jobId,rounds,candidates,appointments,preferredApplicationId,onCommitted,jobTitle,companyName}:{
 jobId:string;rounds:Round[];candidates:Candidate[];appointments:Appointment[];preferredApplicationId?:string;
 onCommitted?:()=>void;jobTitle?:string;companyName?:string;
}){
 const router=useRouter(),pathname=usePathname();const {showToast}=useToast();
 const appRoot=(pathname?.startsWith("/admin/")?"/admin":"/college")+
  "/placements/jobs/"+encodeURIComponent(jobId)+"/applications";
 const available=rounds.filter(round=>round.kind==="INTERVIEW"&&
  ["SCHEDULED","PENDING"].includes(round.status));
 const firstSchedulableRoundId=available[0]?.id??"";
 const applicant=(id:string)=>candidates.find(item=>item.applicationId===id);
 const applicationHref=(id:string)=>{
  const person=applicant(id);
  return appRoot+"?applicationId="+encodeURIComponent(id)+
   (pathname?.startsWith("/admin/")&&person?.name?"&q="+encodeURIComponent(person.name):"");
 };
 useEffect(()=>{
  let lastRefresh=Date.now();
  const onFocus=()=>{
   if(document.visibilityState!=="visible"||Date.now()-lastRefresh<30000)return;
   lastRefresh=Date.now();
   router.refresh();
  };
  window.addEventListener("focus",onFocus);
  return ()=>window.removeEventListener("focus",onFocus);
 },[router]);
 const eventTitle=(row:Appointment)=>{
  const round=rounds.find(item=>item.id===row.roundId);
  return [row.interviewType??"Interview",jobTitle??round?.name??"Placement drive",
   companyName,applicant(row.applicationId)?.name??"Candidate"].filter(Boolean).join(" · ");
 };
 const eventIcsHref=(row:Appointment)=>"data:text/calendar;charset=utf-8,"+
  encodeURIComponent(collegeInterviewIcs({id:row.id,title:eventTitle(row),
   date:row.scheduledAt,durationMinutes:row.durationMinutes,
   location:row.venue??row.meetingUrl}));
 const conflictKinds=(row:Appointment)=>visibleInterviewConflictKinds(row,appointments);
 const hasConflict=(row:Appointment)=>conflictKinds(row).length>0;
 const conflictBadge=(row:Appointment)=>{
  const kinds=conflictKinds(row);
  return kinds.length?<StatusBadge tone="error">
   <span className="inline-flex items-center gap-1">
    <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3 2 21h20L12 3Z"/><path d="M12 9v5m0 3h.01"/>
    </svg>
    {visibleInterviewConflictLabel(kinds)}
   </span>
  </StatusBadge>:null;
 };
 const savingLock=useRef(false);
 const [editing,setEditing]=useState<Appointment|null>(null);
 const [clonedFrom,setClonedFrom]=useState<string|null>(null);
 const [dirty,setDirty]=useState(false);const [confirmDiscard,setConfirmDiscard]=useState(false);
 const [show,setShow]=useState(false);const [roundId,setRoundId]=useState(firstSchedulableRoundId);
 const [applicationId,setApplicationId]=useState(candidates.find(c=>c.applicationId===preferredApplicationId)?.applicationId??candidates[0]?.applicationId??"");
 const [date,setDate]=useState(""),[time,setTime]=useState("");
 const start=date&&time?date+"T"+time:"";
 const validFiveMinuteSlot=/^\d{2}:(?:00|05|10|15|20|25|30|35|40|45|50|55)$/.test(time);
 const [duration,setDuration]=useState(60);
 const [mode,setMode]=useState<"ON_CAMPUS"|"VIRTUAL">("VIRTUAL");
 const [venue,setVenue]=useState("");const [meetingUrl,setMeetingUrl]=useState("");
 const [interviewer,setInterviewer]=useState("");const [reason,setReason]=useState("");
 const [interviewType,setInterviewType]=useState<"SCREENING"|"TECHNICAL"|"HR"|"MANAGERIAL"|"FINAL">("SCREENING");
 const [roundDescription,setRoundDescription]=useState("");
 const [fieldErrors,setFieldErrors]=useState<Record<string,string>>({});
 const [busy,setBusy]=useState(false);const [error,setError]=useState("");
 const [success,setSuccess]=useState("");
 const [decision,setDecision]=useState<{row:Appointment;action:"CANCEL"|"COMPLETED"|"NO_SHOW"}|null>(null);
 const [decisionReason,setDecisionReason]=useState("");
 const [feedbackFor,setFeedbackFor]=useState<Appointment|null>(null);
 const [feedbackRating,setFeedbackRating]=useState(3);
 const [feedbackRecommendation,setFeedbackRecommendation]=useState<"SELECT"|"HOLD"|"REJECT">("HOLD");
 const [feedbackComments,setFeedbackComments]=useState("");
 const [feedbackDirty,setFeedbackDirty]=useState(false);
 const [confirmFeedbackDiscard,setConfirmFeedbackDiscard]=useState(false);
 const feedbackSavingLock=useRef(false);
 const [feedbackExisting,setFeedbackExisting]=useState<{
  rating:number;recommendation:string;comments:string;createdAt:string
 }|null>(null);
 type ScopedPreview={candidate:number;interviewer:number;room:number;
  total:number|null;incomplete:boolean};
 const [scopedPreview,setScopedPreview]=useState<{
  key:string;result:ScopedPreview|null;error:boolean;
 }|null>(null);
 // Bind asynchronous preview results to the exact currently edited fields.
 // An older request must not display a false clean result for a new candidate.
 const previewKey=[show,applicationId,start,duration,interviewer,mode,venue,
  meetingUrl,editing?.id??""].join("|");
 useEffect(()=>{
  if(!show||!start||!validFiveMinuteSlot||!applicationId||!roundId)return;
  let cancelled=false;
  const timeout=setTimeout(()=>{
   let scheduledAt:string;
   try{scheduledAt=driveDeadlineIstToIso(start);}
   catch{return;}
   void apiFetch<ScopedPreview>(
    "/api/placements/college/jobs/"+encodeURIComponent(jobId)+"/interviews/preview",{
     method:"POST",headers:{"content-type":"application/json"},
     body:JSON.stringify({applicationId,scheduledAt,durationMinutes:duration,
      interviewer:interviewer.trim()||null,
      room:(mode==="VIRTUAL"?meetingUrl:venue).trim()||null,
      ...(editing?.id?{excludingInterviewId:editing.id}:{})}),
    }).then(result=>{
     if(!cancelled)setScopedPreview({key:previewKey,result,error:false});
    }).catch(()=>{
     if(!cancelled)setScopedPreview({key:previewKey,result:null,error:true});
    });
  },300);
  return()=>{cancelled=true;clearTimeout(timeout);};
 },[show,applicationId,start,validFiveMinuteSlot,roundId,duration,
   interviewer,mode,venue,meetingUrl,editing?.id,jobId,previewKey]);
 const currentScopedPreview=scopedPreview?.key===previewKey?scopedPreview:null;
 const scopedResult=currentScopedPreview?.result;
 const [showConflictsOnly,setShowConflictsOnly]=useState(false);
 const visibleAppointments=showConflictsOnly?appointments.filter(hasConflict):appointments;
 const [feedbackBusy,setFeedbackBusy]=useState(false);
 const [feedbackError,setFeedbackError]=useState("");
 function feedbackUrl(id:string){
  return "/api/placements/college/jobs/"+encodeURIComponent(jobId)+
   "/interviews/"+encodeURIComponent(id)+"/feedback";
 }
 async function openFeedback(row:Appointment){
  if(busy||feedbackBusy)return;
  setFeedbackFor(row);setFeedbackRating(3);setFeedbackRecommendation("HOLD");
  setFeedbackComments("");setFeedbackExisting(null);setFeedbackError("");
  setFeedbackDirty(false);setConfirmFeedbackDiscard(false);
  setFeedbackBusy(true);
  try{
   const response=await apiFetch<{feedback:typeof feedbackExisting}>(feedbackUrl(row.id),{cache:"no-store"});
   setFeedbackExisting(response.feedback);
  }catch(error){
   setFeedbackError("Unable to load interview feedback. Please try again. "+
    (error instanceof Error?error.message:""));
  }finally{setFeedbackBusy(false);}
 }
 async function submitFeedback(){
  if(!feedbackFor||feedbackBusy||feedbackSavingLock.current||feedbackComments.trim().length<3||
    feedbackComments.length>(feedbackRecommendation==="REJECT"?500:2000)||feedbackExisting)return;
  feedbackSavingLock.current=true;
  setFeedbackBusy(true);setFeedbackError("");
  try{
   await apiFetch(feedbackUrl(feedbackFor.id),{
    method:"POST",headers:{"Content-Type":"application/json"},credentials:"same-origin",
    body:JSON.stringify({expectedVersion:feedbackFor.version,confirmed:true,
     rating:feedbackRating,recommendation:feedbackRecommendation,comments:feedbackComments.trim()}),
   });
   showToast({tone:"success",title:"Feedback submitted successfully"});
   setFeedbackDirty(false);setFeedbackFor(null);router.refresh();onCommitted?.();
  }catch(error){
   setFeedbackError(error instanceof Error?error.message:"Feedback could not be saved.");
  }finally{setFeedbackBusy(false);feedbackSavingLock.current=false;}
 }
 function closeFeedback(){
  if(feedbackBusy){showToast({tone:"info",title:"Wait for feedback submission to finish."});return;}
  if(feedbackDirty&&!feedbackExisting){setConfirmFeedbackDiscard(true);return;}
  setFeedbackFor(null);
 }
 const quoteCsv=(value:string)=>{
  // Prevent spreadsheet programs interpreting candidate-provided values as formulae.
  const escaped=/^[\s]*[=+@-]/.test(value)?"'"+value:value;
  return '"'+escaped.replaceAll('"','""')+'"';
 };
 const appointmentsCsv=[
  ["Candidate","Round","Interview Type","Scheduled (IST)","Duration minutes",
   "Mode","Location","Interviewer","Status"].map(quoteCsv).join(","),
  ...visibleAppointments.map(row=>[
   candidates.find(c=>c.applicationId===row.applicationId)?.name??"Applicant",
   rounds.find(r=>r.id===row.roundId)?.name??"Interview round",
   row.interviewType??"",display(row.scheduledAt),String(row.durationMinutes),
   row.mode,row.venue??row.meetingUrl??"",row.interviewer??"",row.status,
  ].map(quoteCsv).join(",")),
 ].join("\r\n");
 function open(row?:Appointment){
  setClonedFrom(null);
  setEditing(row??null);
  setRoundId(row&&row.status!=="CANCELLED"?row.roundId:firstSchedulableRoundId);
  setApplicationId(row?.applicationId??candidates.find(c=>c.applicationId===preferredApplicationId)?.applicationId??candidates[0]?.applicationId??"");
  const prefill=row?toLocal(row.scheduledAt):"";
  setDate(prefill.slice(0,10));setTime(prefill.slice(11,16));
  setDuration(row?.durationMinutes??60);
  setMode(row?.mode==="ON_CAMPUS"?"ON_CAMPUS":"VIRTUAL");
  setVenue(row?.venue??"");setMeetingUrl(row?.meetingUrl??"");
  setInterviewer(row?.interviewer??"");setReason("");
  const type=row?.interviewType;
  setInterviewType(type==="SCREENING"||type==="TECHNICAL"||type==="HR"||
   type==="MANAGERIAL"||type==="FINAL"?type:"SCREENING");
  setRoundDescription(row?.roundDescription??
   rounds.find(r=>r.id===(row?.status==="CANCELLED"?firstSchedulableRoundId:
     row?.roundId??firstSchedulableRoundId))?.name??"");
  setDirty(false);setConfirmDiscard(false);
  setError("");setSuccess("");setFieldErrors({});setShow(true);
 }
 // Legacy applicant -> Schedule action opens the same form with that
 // applicant already selected. Do not silently switch the selected learner,
 // and never reopen a dismissed form on a data refresh.
 const openedFromApplication=useRef<string|null>(null);
 useEffect(()=>{
  if(!preferredApplicationId||openedFromApplication.current===preferredApplicationId)return;
  if(!candidates.some(candidate=>candidate.applicationId===preferredApplicationId))return;
  openedFromApplication.current=preferredApplicationId;
  open();
 },[preferredApplicationId,candidates]);
 function cloneCancelled(row:Appointment){
  open(row);
  // Reuse the old details as a new audited scheduling request, never send
  // an EDIT mutation against a cancelled appointment/version.
  setEditing(null);
  setClonedFrom(row.id);
  setReason("");
 }
 function closeSetup(){
  if(busy){showToast({tone:"info",title:"Wait for interview submission to finish."});return;}
  if(dirty)setConfirmDiscard(true);
  else setShow(false);
 }
 async function post(body:Record<string,unknown>){
  if(savingLock.current)return false;
  savingLock.current=true;setBusy(true);setError("");setSuccess("");setFieldErrors({});
  try{
   const data=await apiFetch<{status?:string}>("/api/placements/college/jobs/"+encodeURIComponent(jobId)+"/interviews",{
    method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},
    body:JSON.stringify({...body,confirmed:true}),
   });
   setSuccess(body.action==="SCHEDULE"?"Interview scheduled and candidate notified." :
    "Interview "+(data.status??"updated").toLowerCase().replaceAll("_"," ")+". The learner was notified.");
   if(body.action==="SCHEDULE"){
    showToast({tone:"success",title:"Interview scheduled successfully",
     description:"Interview scheduled and candidate notified."});
   }
   setDirty(false);router.refresh();onCommitted?.();return true;
  }catch(e){
   if(e instanceof FriendlyFetchError&&"fieldErrors" in e&&
    typeof e.fieldErrors==="object"&&e.fieldErrors!==null)
    setFieldErrors(e.fieldErrors as Record<string,string>);
   setError(e instanceof Error?e.message:"Interview action failed");return false;
  }
  finally{savingLock.current=false;setBusy(false);}
 }
 async function save(){
  if(!start||!validFiveMinuteSlot||!applicationId||!roundId){
   setError("Choose a date and a time in IST (5-minute increments).");
   return;
  }
  if(roundDescription.trim().length<10){
   setFieldErrors({roundDescription:"Please describe what this round is about"});
   setError("Please describe what this round is about");return;
  }
  let iso:string;
  try{iso=driveDeadlineIstToIso(start);}
  catch{setError("Enter a valid date and time in IST.");return;}
  const appointment={roundId,applicationId,scheduledAt:iso,durationMinutes:duration,
   interviewType,roundDescription:roundDescription.trim(),
   mode,venue:mode==="ON_CAMPUS"?venue.trim():null,
   meetingUrl:mode==="VIRTUAL"?meetingUrl.trim():null,
   interviewer:interviewer.trim()||null};
  const result=await post(editing?{
   action:"EDIT",interviewId:editing.id,expectedVersion:editing.version,
   appointment,reason:reason.trim(),
  }:{action:"SCHEDULE",appointment});
  if(result)setShow(false);
 }
 function decide(row:Appointment,action:"CANCEL"|"COMPLETED"|"NO_SHOW"){
  if(busy)return;
  setDecision({row,action});setDecisionReason("");setError("");
 }
 async function confirmDecision(){
  if(!decision||decisionReason.trim().length<3||busy)return;
  const updated=await post({action:decision.action,interviewId:decision.row.id,
   expectedVersion:decision.row.version,reason:decisionReason.trim()});
  if(updated)setDecision(null);
 }
 const interviewerNames=[...new Set(appointments.map(row=>row.interviewer?.trim()).filter(
  (name):name is string=>Boolean(name)))].sort((a,b)=>a.localeCompare(b));
 const nearInterviewer=interviewer.trim()&&interviewerNames.find(name=>
  name.toLocaleLowerCase()===interviewer.trim().toLocaleLowerCase()&&name!==interviewer.trim());
 const currentCandidate=candidates.find(candidate=>candidate.applicationId===applicationId);
 const currentRound=rounds.find(round=>round.id===roundId);
 // This is a preview of the visible drive only. The server checks the entire
 // college and same-company interviewer under transaction resource locks.
 const proposedStart=start?new Date(start+"+05:30"):null;
 const proposedEnd=proposedStart&&Number.isFinite(proposedStart.getTime())
  ? proposedStart.getTime()+duration*60_000 : null;
 const bufferMs=15*60_000;
 const proposedRoom=(mode==="VIRTUAL"?meetingUrl:venue).trim().toLowerCase();
 const proposedPanel=interviewer.trim().toLowerCase();
 const previewConflicts=proposedEnd===null||!proposedStart?[]:appointments.filter(row=>{
  if(row.id===editing?.id||row.status!=="SCHEDULED")return false;
  const otherStart=new Date(row.scheduledAt).getTime();
  const otherEnd=otherStart+row.durationMinutes*60_000;
  if(otherStart>=proposedEnd+bufferMs||otherEnd<=proposedStart.getTime()-bufferMs)return false;
  return row.applicationId===applicationId ||
   (Boolean(proposedRoom)&&(row.venue??row.meetingUrl??"").trim().toLowerCase()===proposedRoom) ||
   (Boolean(proposedPanel)&&row.interviewer?.trim().toLowerCase()===proposedPanel);
 });
 return <section className="min-w-0 space-y-[var(--lms-space-4)] border-b border-border pb-[var(--lms-space-4)]">
  <div className="flex min-w-0 flex-col gap-[var(--lms-space-3)] md:flex-row md:items-center md:justify-between">
   <div><h2 className="text-lg font-semibold">Candidate interviews</h2>
    <p className="mt-1 text-sm text-body">Schedule, edit, cancel, mark Completed or No Show. Actions are audited and notify the learner.</p></div>
   <div className="flex flex-col gap-2 sm:flex-row">
    <Link href={appRoot} className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-[var(--lms-link-text)] md:min-h-9">
      View applications
    </Link>
    <Button type="button" variant="secondary" aria-pressed={showConflictsOnly}
      onClick={()=>setShowConflictsOnly(value=>!value)} className="min-h-11 md:min-h-9">
      {showConflictsOnly?"Show all interviews":"Conflicts only ("+appointments.filter(hasConflict).length+")"}
    </Button>
    <a download="interviews.csv" href={"data:text/csv;charset=utf-8,"+encodeURIComponent("\uFEFF"+appointmentsCsv+"\r\n")}
     className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-[var(--lms-link-text)] md:min-h-9">
     Export CSV
    </a>
    <Button type="button" disabled={!available.length||!candidates.length}
     className="min-h-11 w-full md:w-auto md:min-h-9" onClick={()=>open()}>Schedule interview</Button>
   </div>
  </div>
  {!available.length?<Banner tone="info">No pending or scheduled interview round is available. Set up a round before scheduling interviews.</Banner>:null}
  {!candidates.length?<Banner tone="info">No eligible candidate is available in this drive. Open Applications to review candidate screening and shortlisting before scheduling.</Banner>:null}
  <div className="grid min-w-0 gap-3 min-[768px]:hidden" aria-label="Candidate interview cards">
   {visibleAppointments.map(row=>{
    const person=applicant(row.applicationId);
    const round=rounds.find(item=>item.id===row.roundId);
    return <article key={row.id} className="min-w-0 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4">
     <div className="flex flex-wrap items-start justify-between gap-2">
      <div className="min-w-0 flex-1">
       {companyName?<p className="text-xs font-semibold text-muted-foreground">{companyName}</p>:null}
       {jobTitle?<p className="text-xs text-body">{jobTitle}</p>:null}
       <h3 className="mt-1 break-words text-base font-semibold">{person?.name??"Candidate"}</h3>
       {person?.departmentName?<p className="text-xs text-body">{person.departmentName}</p>:null}
      </div>
      <div className="flex flex-wrap gap-1">
       <StatusBadge tone={row.status==="COMPLETED"?"success":row.status==="SCHEDULED"?"info":row.status==="CANCELLED"?"neutral":"warning"}>{row.status.replaceAll("_"," ")}</StatusBadge>
       {conflictBadge(row)}
      </div>
     </div>
     <p className="mt-3 text-sm font-semibold">{row.interviewType?.replaceAll("_"," ")??"Interview"} · {round?.name??"Interview round"}</p>
     <dl className="mt-3 grid gap-2 border-t border-border pt-3 text-sm text-body">
      <div><dt className="font-semibold">Date & time (IST)</dt><dd>{display(row.scheduledAt)} · {row.durationMinutes} min</dd></div>
      <div><dt className="font-semibold">Mode</dt><dd>{row.mode==="VIRTUAL"?"Online":"Offline"} · {row.venue??row.meetingUrl??"Not recorded"}</dd></div>
      <div><dt className="font-semibold">Interviewer</dt><dd>{row.interviewer??"Not recorded"}</dd></div>
     </dl>
     <div className="mt-3 flex flex-wrap gap-2">
      <Link href={applicationHref(row.applicationId)} aria-label={"View application for "+(person?.name??"candidate")+" in "+(jobTitle??"this placement drive")}
       className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-link underline">View application</Link>
      {row.status!=="CANCELLED"?<a href={eventIcsHref(row)} download={"interview-"+row.id+".ics"}
       aria-label={"Download calendar file for "+eventTitle(row)}
       className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-link">↓ Download .ics</a>:null}
      {row.status==="SCHEDULED"?<Button type="button" variant="secondary" disabled={busy} onClick={()=>open(row)}>Edit</Button>:null}
      {row.status==="CANCELLED"&&rounds.some(round=>round.id===row.roundId&&
        ["SCHEDULED","PENDING"].includes(round.status))?
       <Button type="button" variant="secondary" disabled={busy} onClick={()=>cloneCancelled(row)}>Run it again (copy)</Button>:null}
      {row.status==="SCHEDULED"?<>
       <Button type="button" variant="secondary" disabled={busy} onClick={()=>decide(row,"COMPLETED")}>Completed</Button>
       <Button type="button" variant="secondary" disabled={busy} onClick={()=>decide(row,"NO_SHOW")}>No Show</Button>
       <Button type="button" variant="secondary" disabled={busy} onClick={()=>decide(row,"CANCEL")}>Cancel</Button>
      </>:null}
      {row.status==="COMPLETED"?<Button type="button" variant="secondary" disabled={busy} onClick={()=>void openFeedback(row)}>Interview feedback</Button>:null}
     </div>
    </article>;
   })}
   {!visibleAppointments.length?(showConflictsOnly?
    <EmptyState title="No conflicting candidate interviews" description="No scheduling conflicts were found in the current filtered interview rows."/>:
    <EmptyState title="No candidate interviews" description="No interviews scheduled for this drive yet."/>):null}
  </div>
  <div className="hidden min-[768px]:block">
  <DataTable<(typeof appointments)[number]>
    caption="Candidate interviews"
    rows={visibleAppointments}
    getRowKey={row=>row.id}
    columns={[
      {key:"candidate",header:"Candidate",mobilePriority:"primary",
        cell:row=>{
         const person=applicant(row.applicationId);
         return <span className="grid min-w-0 gap-1">
          <span className="font-semibold">{person?.name??row.applicationId}</span>
          {person?.departmentName?<span className="text-xs text-body">{person.departmentName}</span>:null}
          {person?.rollNumber?<span className="text-xs text-body">{person.rollNumber}</span>:null}
         </span>;
        }},
      {key:"round",header:"Round",mobilePriority:"secondary",
        cell:row=>rounds.find(r=>r.id===row.roundId)?.name??"Interview round"},
      {key:"type",header:"Interview type",mobilePriority:"secondary",cell:row=>
        <StatusBadge tone={row.interviewType==="HR"?"success":row.interviewType==="TECHNICAL"?"info":
          row.interviewType==="FINAL"?"warning":"neutral"}>
          {(row.interviewType??"Interview").replaceAll("_"," ")}
        </StatusBadge>},
      {key:"time",header:"Date & Time (IST)",mobilePriority:"secondary",
        cell:row=>display(row.scheduledAt)+" · "+row.durationMinutes+" min"},
      {key:"location",header:"Mode and location",mobilePriority:"secondary",
        cell:row=>(row.mode==="VIRTUAL"?"Virtual":"On campus")+" · "+(row.venue??row.meetingUrl??"—")},
      {key:"interviewer",header:"Interviewer",mobilePriority:"secondary",
        cell:row=>row.interviewer??"Not recorded"},
      {key:"clash",header:"Conflicts",mobilePriority:"secondary",
        cell:row=>conflictBadge(row)??"—"},
      {key:"status",header:"Status",mobilePriority:"secondary",cell:row=><StatusBadge tone={row.status==="COMPLETED"?"success":row.status==="SCHEDULED"?"info":row.status==="CANCELLED"?"neutral":"warning"}>{row.status}</StatusBadge>},
      {key:"actions",header:"Actions",mobilePriority:"action",
        cell:row=><Disclosure title="Actions" className="min-w-0 md:min-w-40">
          <div className="flex min-w-0 flex-col items-stretch gap-[var(--lms-space-2)] pb-2 md:flex-row md:flex-wrap">
     <Link href={applicationHref(row.applicationId)}
       aria-label={"View application for "+(applicant(row.applicationId)?.name??"candidate")+" in "+(jobTitle??"this placement drive")}
       className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-[var(--lms-link-text)] underline min-[768px]:min-h-9">
       View application
     </Link>
     {row.status!=="CANCELLED"?<a download={"interview-"+row.id+".ics"}
      href={eventIcsHref(row)} aria-label={"Download calendar file for "+eventTitle(row)}
       className="inline-flex min-h-11 min-[768px]:min-h-9 items-center gap-2 rounded-[var(--lms-control-radius)] border border-border px-3 text-[14px] font-[650] text-[var(--lms-link-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-teal-deep)]">
      <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" stroke="currentColor"
        fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 2v6M17 2v6M3 11h18"/>
      </svg>Download .ics</a>:null}
     {row.status==="COMPLETED"?<Button type="button" variant="secondary"
      disabled={busy} onClick={()=>void openFeedback(row)}>Interview feedback</Button>:null}
     {row.status==="CANCELLED"&&rounds.some(round=>round.id===row.roundId&&
        ["SCHEDULED","PENDING"].includes(round.status))?
       <Button type="button" variant="secondary" disabled={busy} onClick={()=>cloneCancelled(row)}>
        Run it again (copy)
       </Button>:null}
     {row.status==="SCHEDULED"?<>
      <Button type="button" disabled={busy} variant="secondary" onClick={()=>open(row)}
       >Edit</Button>
      <Button type="button" disabled={busy} variant="secondary" onClick={()=>void decide(row,"COMPLETED")}
       >Completed</Button>
      <Button type="button" disabled={busy} variant="secondary" onClick={()=>void decide(row,"NO_SHOW")}
       >No Show</Button>
      <Button type="button" disabled={busy} variant="secondary" onClick={()=>void decide(row,"CANCEL")}
       >Cancel</Button>
     </>:<span className="text-body">Recorded</span>}
          </div>
         </Disclosure>},
    ]}
    empty={showConflictsOnly?<EmptyState title="No conflicting candidate interviews" description="No scheduling conflicts were found in the current filtered interview rows."/>:
      <EmptyState title="No candidate interviews" description="No interviews scheduled for this drive yet."/>}
  />
  </div>
  {success?<Banner tone="success">{success}</Banner>:null}
  {error&&!show?<Banner tone="error">{error}</Banner>:null}
  <Dialog open={show} onOpenChange={next=>{if(!next)closeSetup();}} title={editing?"Edit interview":"Schedule interview"} dismissible={!busy}
   footer={<>
    <Button type="button" className="min-h-11 w-full md:w-auto md:min-h-9" disabled={busy||!start||!validFiveMinuteSlot||!roundId||!applicationId||!INTERVIEW_DURATIONS.includes(duration as typeof INTERVIEW_DURATIONS[number])||roundDescription.trim().length<10||(Boolean(editing)&&reason.trim().length<3)} onClick={()=>void save()}>
     {busy?"Saving…":editing?.status==="RESCHEDULE_REQUESTED"?"Apply new slot":editing?"Save changes":"Schedule Interview"}</Button>
    <Button type="button" className="min-h-11 w-full md:w-auto md:min-h-9" disabled={busy} variant="secondary" onClick={closeSetup}>Cancel</Button>
   </>}>
    <h3 className="sr-only">{editing?"Edit interview":"Schedule interview"}</h3>
    {clonedFrom?<Banner tone="info" role="status">
      Reusing a cancelled interview. Choose a new date and time before scheduling; the cancelled record will not be changed.
    </Banner>:null}
    {appointments.filter(row=>row.applicationId===applicationId&&row.id!==editing?.id&&row.status!=="CANCELLED").length>0?
      <Banner tone="info" role="status">This candidate has another interview in this drive. Check the time, room and interviewer before scheduling another.</Banner>:null}
    {editing?.status==="RESCHEDULE_REQUESTED"?<Banner tone="warning" role="status">
      <strong>Reschedule requested.</strong> Review the candidate’s request before applying a new slot.
      {editing.outcomeNote?<p className="mt-2 whitespace-pre-wrap">{editing.outcomeNote}</p>:null}
    </Banner>:null}
    {currentCandidate?<div className="rounded-[8px] border border-border bg-[#fafafa] p-3 text-sm"
      aria-label="Interview candidate details">
      <strong className="block">{currentCandidate?.name?.trim()||"Candidate"}</strong>
      <span className="block text-xs text-muted-foreground">
       {currentRound?.name||"Interview round"} · {jobTitle??"Drive "+jobId.slice(0,8)}
       {companyName?" · "+companyName:""}
      </span>
    </div>:null}
    <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] text-[13px]">Round<Select value={roundId} disabled={busy||Boolean(editing)}
     onChange={e=>{setRoundId(e.target.value);setDirty(true);}} className="w-full">
     {available.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}
    </Select></label>
    <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] text-[13px]">Candidate<Select value={applicationId} disabled={busy||Boolean(editing)}
     onChange={e=>{setApplicationId(e.target.value);setDirty(true);}} className="w-full">
     {candidates.map(c=><option key={c.applicationId} value={c.applicationId}>{c.name??"Learner"} · {c.screening}</option>)}
    </Select></label>
    <div className="grid min-w-0 gap-3">
     <label className="grid gap-[6px] text-[13px] font-semibold">Interview Type
      <Select value={interviewType} disabled={busy} onChange={event=>{
       setInterviewType(event.target.value as typeof interviewType);setDirty(true);
      }} className="w-full">
       <option value="SCREENING">Screening</option><option value="TECHNICAL">Technical</option>
       <option value="HR">HR</option><option value="MANAGERIAL">Managerial</option>
       <option value="FINAL">Final</option>
      </Select>
     </label>
     <label className="grid gap-[6px] text-[13px] font-semibold">
      What this round is about <span className="text-xs text-muted-foreground">({roundDescription.length}/500)</span>
      <Textarea rows={3} minLength={10} maxLength={500} disabled={busy} value={roundDescription}
       placeholder="Explain this interview round and how candidates should prepare"
       onChange={event=>{setRoundDescription(event.target.value);setDirty(true);}}
       className="w-full"/>
      {fieldErrors.roundDescription?<span role="alert" className="text-error">{fieldErrors.roundDescription}</span>:null}
     </label>
    </div>
    <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] text-[13px]">
      Interviewer(s) <span className="text-xs font-normal text-muted-foreground">Use the same spelling as existing interviews to avoid double-booking.</span>
     <Input value={interviewer} list={"interviewer-suggestions-"+jobId} maxLength={255} disabled={busy}
      placeholder="e.g. Jane Doe, Ravi Kumar" autoComplete="off"
      onChange={e=>{setInterviewer(e.target.value);setDirty(true);}} className="w-full"/>
     <datalist id={"interviewer-suggestions-"+jobId}>
      {interviewerNames.filter(name=>name.toLowerCase().includes(interviewer.toLowerCase())).slice(0,30).map(name=>
        <option key={name} value={name}/>)}
     </datalist>
     {nearInterviewer?<span role="status" className="text-xs text-warning">Existing name uses “{nearInterviewer}”. Select the existing spelling.</span>:null}
     </label>
    <div className="grid min-w-0 gap-[var(--lms-space-3)] md:grid-cols-1">
     <label className="grid min-w-0 gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
      Date (IST)
      <Input type="date" required disabled={busy} value={date}
       onChange={e=>{setDate(e.target.value);setDirty(true);setFieldErrors({});}} className="w-full"/>
     </label>
     <label className="grid min-w-0 gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
      Time (IST, 5-minute increments)
      <Input type="time" step={300} required disabled={busy} value={time}
       onChange={e=>{setTime(e.target.value);setDirty(true);setFieldErrors({});}} className="w-full"/>
      {time&&!validFiveMinuteSlot?<span role="alert" className="text-xs text-error">Choose a time in 5-minute increments.</span>:null}
     </label>
     <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] text-[13px]">Duration (minutes)
      <Select value={String(duration)} disabled={busy} onChange={e=>{setDuration(Number(e.target.value));setDirty(true);}} className="w-full">
        {!INTERVIEW_DURATIONS.includes(duration as typeof INTERVIEW_DURATIONS[number])?<option value={duration}>{duration} minutes (existing)</option>:null}
        {INTERVIEW_DURATIONS.map(value=><option key={value} value={value}>{value} minutes</option>)}
      </Select></label>
    </div>
    <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] text-[13px]">Mode<Select value={mode} disabled={busy} onChange={e=>{setMode(e.target.value as "ON_CAMPUS"|"VIRTUAL");setVenue("");setMeetingUrl("");setFieldErrors({});setDirty(true);}}
     className="w-full">
     <option value="ON_CAMPUS">Offline</option><option value="VIRTUAL">Online</option></Select></label>
    <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] text-[13px]">{mode==="VIRTUAL"?"Meeting Link":"Venue Address"}
     <Input value={mode==="VIRTUAL"?meetingUrl:venue} maxLength={500} disabled={busy}
      placeholder={mode==="VIRTUAL"?"https://meet.example.com/...":"Enter interview venue address"}
      onChange={e=>{mode==="VIRTUAL"?setMeetingUrl(e.target.value):setVenue(e.target.value);setDirty(true);}}
      className="w-full"/>
     {fieldErrors[mode==="VIRTUAL"?"meetingUrl":"venue"]?<span role="alert" className="text-xs text-error">{fieldErrors[mode==="VIRTUAL"?"meetingUrl":"venue"]}</span>:null}
     </label>
    <p className="text-xs text-muted-foreground">Times shown in Asia/Kolkata (IST). The server checks other drives and interviewer conflicts before accepting a slot.</p>
    {scopedResult?.incomplete?<Banner tone="warning" role="alert">
      More than 500 overlapping appointments were found in this college. The preview is incomplete; review the calendar before booking. Server-side scheduling checks remain authoritative.
    </Banner>:null}
    {scopedResult&&scopedResult.total!==null&&scopedResult.total>0?<Banner tone="warning" role="alert">
      Possible scheduling conflict with {scopedResult.total} interview(s) across this college (15-minute buffer).
      Candidate: {scopedResult.candidate}; same-company interviewer: {scopedResult.interviewer}; room: {scopedResult.room}.
      Review the other bookings before saving; the server rechecks conflicts.
    </Banner>:null}
    {currentScopedPreview?.error?<Banner tone="warning" role="alert">
      The college-wide scheduling preview could not be loaded. Review the interview calendar and retry; saving will still perform server-side overlap checks.
    </Banner>:null}
    {!currentScopedPreview?.result&&previewConflicts.length>0?<Banner tone="warning" role="alert">
      Possible scheduling conflict with {previewConflicts.length} interview{previewConflicts.length===1?"":"s"} in this drive, including a 15-minute buffer. The college-wide preview is checked separately.
    </Banner>:null}
    {!currentScopedPreview&&!previewConflicts.length&&show&&start&&applicationId&&validFiveMinuteSlot?
      <p role="status" className="text-xs text-muted-foreground">Checking other interviews in this college…</p>:null}
    {editing?<label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] text-[13px]">Reason for change<Textarea rows={2} value={reason} disabled={busy}
     onChange={e=>{setReason(e.target.value);setDirty(true);}} className="w-full"/></label>:null}
    {error?<Banner tone="error" action={<Button type="button" size="sm"
      variant="secondary" onClick={()=>setError("")}>Dismiss</Button>}>
      <strong>Interview was not scheduled.</strong> {error}
    </Banner>:null}

  </Dialog>
  <Dialog open={feedbackFor!==null} onOpenChange={next=>{if(!next)closeFeedback();}} title="Interview feedback" description="Staff-only review. Rating and recommendation do not update selection results."
   dismissible={true}
   footer={<>
    {!feedbackExisting?<Button type="button" disabled={feedbackBusy||
     feedbackError.startsWith("Unable to load")||feedbackComments.trim().length<3||
     feedbackComments.length>(feedbackRecommendation==="REJECT"?500:2000)}
     onClick={()=>void submitFeedback()}>{feedbackBusy?"Submitting…":"Submit feedback"}</Button>:null}
    <Button type="button" variant="secondary" disabled={feedbackBusy} onClick={closeFeedback}>
      {feedbackExisting?"Close":"Cancel"}
    </Button>
   </>}>
   {feedbackFor?<div className="rounded-[6px] border border-[#e8e8e8] bg-[#f6f8fa] px-[14px] py-[10px] text-sm">
     <strong>{applicant(feedbackFor.applicationId)?.name??"Candidate"}</strong>
     {jobTitle?<span className="text-muted-foreground"> · {jobTitle}</span>:null}
     <span className="text-muted-foreground"> · {(feedbackFor.interviewType??"Interview").charAt(0)+
      (feedbackFor.interviewType??"Interview").slice(1).toLowerCase()} round</span>
    </div>:null}
   {feedbackBusy?<p role="status">Loading interview feedback…</p>:null}
   {feedbackExisting?<div className="space-y-2 text-sm">
    <p className="font-semibold">Feedback already submitted</p>
    <p>Rating: {feedbackExisting.rating} / 5</p>
    <p>Recommendation: {feedbackExisting.recommendation}</p>
    <p className="whitespace-pre-wrap">Comments: {feedbackExisting.comments}</p>
    <p className="text-xs text-muted-foreground">Recorded on {display(feedbackExisting.createdAt)}</p>
   </div>:!feedbackBusy?<>
    <label className="grid gap-2 text-[13px] font-semibold">Rating (1–5)
     <Select value={String(feedbackRating)} disabled={feedbackBusy}
      onChange={event=>{setFeedbackRating(Number(event.target.value));setFeedbackDirty(true);}}>
      {[1,2,3,4,5].map(value=><option key={value} value={value}>{value} / 5</option>)}
     </Select>
    </label>
    <label className="mt-3 grid gap-2 text-[13px] font-semibold">Recommendation
     <Select value={feedbackRecommendation} disabled={feedbackBusy} onChange={event=>{
      setFeedbackRecommendation(event.target.value as typeof feedbackRecommendation);
      setFeedbackDirty(true);
     }}>
      <option value="SELECT">Recommend selecting</option>
      <option value="HOLD">Hold for review</option>
      <option value="REJECT">Recommend not selecting</option>
     </Select>
    </label>
    <label className="mt-3 grid gap-2 text-[13px] font-semibold">
      Comments <span className="text-xs font-normal text-muted-foreground">
        ({feedbackComments.length}/{feedbackRecommendation==="REJECT"?500:2000})
      </span>
     <Textarea value={feedbackComments} rows={4}
      maxLength={feedbackRecommendation==="REJECT"?500:2000}
      disabled={feedbackBusy} placeholder="Feedback notes (observations, strengths, areas for improvement, etc.)"
      onChange={event=>{setFeedbackComments(event.target.value);setFeedbackDirty(true);}}/>
     <span className="text-xs font-normal text-muted-foreground">
       Staff-only feedback; these notes do not change placement selection results or notify the learner.
       {feedbackRecommendation==="REJECT"?" Please keep rejection remarks within 500 characters.":""}
     </span>
    </label>
   </>:null}
   {feedbackError?<Banner tone="error" action={<Button type="button" size="sm"
    variant="secondary" onClick={()=>feedbackFor&&void openFeedback(feedbackFor)}>
    Retry</Button>}>{feedbackError}</Banner>:null}
  </Dialog>
  <ConfirmDialog open={confirmFeedbackDiscard} onOpenChange={setConfirmFeedbackDiscard}
   title="Discard unsaved feedback?"
   description="You have unsaved interview feedback. Discard these changes?"
   confirmLabel="Discard" cancelLabel="Keep editing" confirmVariant="danger"
   onConfirm={()=>{setConfirmFeedbackDiscard(false);setFeedbackDirty(false);setFeedbackFor(null);}}/>
  <ConfirmDialog open={confirmDiscard} onOpenChange={setConfirmDiscard}
   title="Discard interview setup?"
   description="There are unsaved interview changes."
   confirmLabel="Discard changes" cancelLabel="Keep editing" confirmVariant="danger"
   onConfirm={()=>{setConfirmDiscard(false);setDirty(false);setShow(false);}}/>
  <ConfirmDialog open={decision!==null} onOpenChange={open=>{if(!open&&!busy)setDecision(null);}}
   title={decision?.action==="CANCEL"?"Cancel interview?":decision?.action==="NO_SHOW"?"Mark No Show?":"Mark interview completed?"}
   description="This action is recorded and the learner will be notified."
   confirmLabel="Save decision" pending={busy} confirmDisabled={decisionReason.trim().length<3}
   onConfirm={()=>void confirmDecision()}>
   <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Reason or outcome note
    <Textarea rows={3} value={decisionReason} onChange={e=>setDecisionReason(e.target.value)}
     className="w-full" /></label>
  </ConfirmDialog>
 </section>;
}

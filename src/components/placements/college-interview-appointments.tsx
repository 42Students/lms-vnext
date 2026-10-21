"use client";
import { Button } from "@/components/ui/button";
import {useToast} from "@/components/ui/toast";
import { Textarea } from "@/components/ui/textarea";
import {DataTable} from "@/components/ui/data-table";
import {Banner} from "@/components/ui/banner";
import {StatusBadge} from "@/components/ui/status-badge";
import {EmptyState} from "@/components/ui/empty-state";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {Dialog} from "@/components/ui/dialog";
import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {driveDeadlineIstToIso} from "@/modules/placements/tpo-drive-deadline-ist";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import { Disclosure } from "@/components/ui/disclosure";
import {collegeInterviewIcs} from "@/modules/placements/college-interview-calendar-model";
type Round={id:string;name:string;status:string;kind:string};
type Candidate={applicationId:string;name:string|null;screening:string};
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
export function CollegeInterviewAppointments({jobId,rounds,candidates,appointments,preferredApplicationId,onCommitted}:{
 jobId:string;rounds:Round[];candidates:Candidate[];appointments:Appointment[];preferredApplicationId?:string;
 onCommitted?:()=>void;
}){
 const router=useRouter();const {showToast}=useToast();
 const savingLock=useRef(false);
 const [editing,setEditing]=useState<Appointment|null>(null);
 const [dirty,setDirty]=useState(false);const [confirmDiscard,setConfirmDiscard]=useState(false);
 const [show,setShow]=useState(false);const [roundId,setRoundId]=useState(rounds[0]?.id??"");
 const [applicationId,setApplicationId]=useState(candidates.find(c=>c.applicationId===preferredApplicationId)?.applicationId??candidates[0]?.applicationId??"");
 const [start,setStart]=useState("");const [duration,setDuration]=useState(60);
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
 const [feedbackExisting,setFeedbackExisting]=useState<{
  rating:number;recommendation:string;comments:string;createdAt:string
 }|null>(null);
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
  if(!feedbackFor||feedbackBusy||feedbackComments.trim().length<3||feedbackExisting)return;
  setFeedbackBusy(true);setFeedbackError("");
  try{
   await apiFetch(feedbackUrl(feedbackFor.id),{
    method:"POST",headers:{"Content-Type":"application/json"},credentials:"same-origin",
    body:JSON.stringify({expectedVersion:feedbackFor.version,confirmed:true,
     rating:feedbackRating,recommendation:feedbackRecommendation,comments:feedbackComments.trim()}),
   });
   showToast({tone:"success",title:"Feedback submitted successfully"});
   setFeedbackFor(null);router.refresh();onCommitted?.();
  }catch(error){
   setFeedbackError(error instanceof Error?error.message:"Feedback could not be saved.");
  }finally{setFeedbackBusy(false);}
 }
 const quoteCsv=(value:string)=>{
  // Prevent spreadsheet programs interpreting candidate-provided values as formulae.
  const escaped=/^[\s]*[=+@-]/.test(value)?"'"+value:value;
  return '"'+escaped.replaceAll('"','""')+'"';
 };
 const appointmentsCsv=[
  ["Candidate","Round","Interview Type","Scheduled (IST)","Duration minutes",
   "Mode","Location","Interviewer","Status"].map(quoteCsv).join(","),
  ...appointments.map(row=>[
   candidates.find(c=>c.applicationId===row.applicationId)?.name??"Applicant",
   rounds.find(r=>r.id===row.roundId)?.name??"Interview round",
   row.interviewType??"",display(row.scheduledAt),String(row.durationMinutes),
   row.mode,row.venue??row.meetingUrl??"",row.interviewer??"",row.status,
  ].map(quoteCsv).join(",")),
 ].join("\r\n");
 function open(row?:Appointment){
  setEditing(row??null);setRoundId(row?.roundId??rounds[0]?.id??"");
  setApplicationId(row?.applicationId??candidates.find(c=>c.applicationId===preferredApplicationId)?.applicationId??candidates[0]?.applicationId??"");
  setStart(row?toLocal(row.scheduledAt):"");setDuration(row?.durationMinutes??60);
  setMode(row?.mode==="ON_CAMPUS"?"ON_CAMPUS":"VIRTUAL");
  setVenue(row?.venue??"");setMeetingUrl(row?.meetingUrl??"");
  setInterviewer(row?.interviewer??"");setReason("");
  const type=row?.interviewType;
  setInterviewType(type==="SCREENING"||type==="TECHNICAL"||type==="HR"||
   type==="MANAGERIAL"||type==="FINAL"?type:"SCREENING");
  setRoundDescription(row?.roundDescription??rounds.find(r=>r.id===(row?.roundId??rounds[0]?.id))?.name??"");
  setDirty(false);setConfirmDiscard(false);
  setError("");setSuccess("");setFieldErrors({});setShow(true);
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
  if(!start||!applicationId||!roundId)return;
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
 const available=rounds.filter(r=>["SCHEDULED","PENDING"].includes(r.status));
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
    <a download="drive-interviews.csv" href={"data:text/csv;charset=utf-8,"+encodeURIComponent(appointmentsCsv)}
     className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-[var(--lms-link-text)] md:min-h-9">
     Export CSV
    </a>
    <Button type="button" disabled={!available.length||!candidates.length}
     className="min-h-11 w-full md:w-auto md:min-h-9" onClick={()=>open()}>Schedule interview</Button>
   </div>
  </div>
  {!available.length||!candidates.length?<Banner tone="info">Schedule an interview when a pending or scheduled round and a candidate are available.</Banner>:null}
  <DataTable<(typeof appointments)[number]>
    caption="Candidate interviews"
    rows={appointments}
    getRowKey={row=>row.id}
    columns={[
      {key:"candidate",header:"Candidate",mobilePriority:"primary",
        cell:row=>candidates.find(c=>c.applicationId===row.applicationId)?.name??row.applicationId},
      {key:"round",header:"Round",mobilePriority:"secondary",
        cell:row=>rounds.find(r=>r.id===row.roundId)?.name??"Interview round"},
      {key:"time",header:"Date & Time (IST)",mobilePriority:"secondary",
        cell:row=>display(row.scheduledAt)+" · "+row.durationMinutes+" min"},
      {key:"location",header:"Mode and location",mobilePriority:"secondary",
        cell:row=>(row.mode==="VIRTUAL"?"Virtual":"On campus")+" · "+(row.venue??row.meetingUrl??"—")},
      {key:"interviewer",header:"Interviewer",mobilePriority:"secondary",
        cell:row=>row.interviewer??"Not recorded"},
      {key:"clash",header:"Conflicts",mobilePriority:"secondary",cell:row=>{
       const began=Date.parse(row.scheduledAt);
       const ended=began+row.durationMinutes*60_000;
       const conflict=appointments.some(other=>other.id!==row.id&&other.status==="SCHEDULED"&&
        Date.parse(other.scheduledAt)<ended+15*60_000&&
        Date.parse(other.scheduledAt)+other.durationMinutes*60_000>began-15*60_000&&
        (other.applicationId===row.applicationId||
         (Boolean(row.venue??row.meetingUrl)&&(other.venue??other.meetingUrl)=== (row.venue??row.meetingUrl))||
         (Boolean(row.interviewer)&&other.interviewer===row.interviewer)));
       return conflict?<StatusBadge tone="error">Conflict</StatusBadge>:"—";
      }},
      {key:"status",header:"Status",mobilePriority:"secondary",cell:row=><StatusBadge tone={row.status==="COMPLETED"?"success":row.status==="SCHEDULED"?"info":row.status==="CANCELLED"?"neutral":"warning"}>{row.status}</StatusBadge>},
      {key:"actions",header:"Actions",mobilePriority:"action",
        cell:row=><Disclosure title="Actions" className="min-w-0 md:min-w-40">
          <div className="flex min-w-0 flex-col items-stretch gap-[var(--lms-space-2)] pb-2 md:flex-row md:flex-wrap">
     {row.status!=="CANCELLED"?<a download={"interview-"+row.id+".ics"}
      href={"data:text/calendar;charset=utf-8,"+encodeURIComponent(collegeInterviewIcs({
       id:row.id,title:"College interview",date:row.scheduledAt,
       durationMinutes:row.durationMinutes,location:row.venue??row.meetingUrl,
      }))} className="inline-flex min-h-11 min-[768px]:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-[14px] font-[650] text-[var(--lms-link-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-teal-deep)]">
      Download .ics</a>:null}
     {row.status==="COMPLETED"?<Button type="button" variant="secondary"
      disabled={busy} onClick={()=>void openFeedback(row)}>Interview feedback</Button>:null}
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
    empty={<EmptyState title="No candidate interviews" description="No interviews scheduled for this drive yet."/>}
  />
  {success?<Banner tone="success">{success}</Banner>:null}
  {error&&!show?<Banner tone="error">{error}</Banner>:null}
  <Dialog open={show} onOpenChange={next=>{if(!next)closeSetup();}} title={editing?"Edit interview":"Schedule interview"} dismissible={!busy}
   footer={<>
    <Button type="button" className="min-h-11 w-full md:w-auto md:min-h-9" disabled={busy||!start||!roundId||!applicationId||!INTERVIEW_DURATIONS.includes(duration as typeof INTERVIEW_DURATIONS[number])||roundDescription.trim().length<10||(Boolean(editing)&&reason.trim().length<3)} onClick={()=>void save()}>
     {busy?"Saving…":editing?.status==="RESCHEDULE_REQUESTED"?"Apply new slot":editing?"Save changes":"Schedule and notify"}</Button>
    <Button type="button" className="min-h-11 w-full md:w-auto md:min-h-9" disabled={busy} variant="secondary" onClick={closeSetup}>Cancel</Button>
   </>}>
    <h3 className="sr-only">{editing?"Edit interview":"Schedule interview"}</h3>
    {editing?.status==="RESCHEDULE_REQUESTED"?<Banner tone="warning" role="status">
      <strong>Reschedule requested.</strong> Review the candidate’s request before applying a new slot.
      {editing.outcomeNote?<p className="mt-2 whitespace-pre-wrap">{editing.outcomeNote}</p>:null}
    </Banner>:null}
    {editing?<div className="rounded-[8px] border border-border bg-[#fafafa] p-3 text-sm"
      aria-label="Editing interview for selected candidate">
      <strong className="block">{currentCandidate?.name?.trim()||"Candidate"}</strong>
      <span className="block text-xs text-muted-foreground">{currentRound?.name||"Interview round"} · Job {jobId.slice(0,8)}</span>
    </div>:null}
    <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] text-[13px]">Round<Select value={roundId} disabled={Boolean(editing)}
     onChange={e=>{setRoundId(e.target.value);setDirty(true);}} className="w-full">
     {available.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}
    </Select></label>
    <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] text-[13px]">Candidate<Select value={applicationId} disabled={Boolean(editing)}
     onChange={e=>{setApplicationId(e.target.value);setDirty(true);}} className="w-full">
     {candidates.map(c=><option key={c.applicationId} value={c.applicationId}>{c.name??"Learner"} · {c.screening}</option>)}
    </Select></label>
    <div className="grid min-w-0 gap-3 sm:grid-cols-2">
     <label className="grid gap-[6px] text-[13px] font-semibold">Interview Type
      <Select value={interviewType} onChange={event=>{
       setInterviewType(event.target.value as typeof interviewType);setDirty(true);
      }} className="w-full">
       <option value="SCREENING">Screening</option><option value="TECHNICAL">Technical</option>
       <option value="HR">HR</option><option value="MANAGERIAL">Managerial</option>
       <option value="FINAL">Final</option>
      </Select>
     </label>
     <label className="grid gap-[6px] text-[13px] font-semibold sm:col-span-2">
      What this round is about <span className="text-xs text-muted-foreground">({roundDescription.length}/500)</span>
      <Textarea rows={3} minLength={10} maxLength={500} value={roundDescription}
       placeholder="Explain this interview round and how candidates should prepare"
       onChange={event=>{setRoundDescription(event.target.value);setDirty(true);}}
       className="w-full"/>
      {fieldErrors.roundDescription?<span role="alert" className="text-error">{fieldErrors.roundDescription}</span>:null}
     </label>
    </div>
    <div className="grid min-w-0 gap-[var(--lms-space-3)] md:grid-cols-2">
     <label className="grid min-w-0 gap-[var(--lms-space-2)] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Date & time (IST)<Input type="datetime-local" step={300} required value={start}
      onChange={e=>{setStart(e.target.value);setDirty(true);}} className="w-full"/></label>
     <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] text-[13px]">Duration (minutes)
      <Select value={String(duration)} onChange={e=>{setDuration(Number(e.target.value));setDirty(true);}} className="w-full">
        {!INTERVIEW_DURATIONS.includes(duration as typeof INTERVIEW_DURATIONS[number])?<option value={duration}>{duration} minutes (existing)</option>:null}
        {INTERVIEW_DURATIONS.map(value=><option key={value} value={value}>{value} minutes</option>)}
      </Select></label>
    </div>
    <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] text-[13px]">Mode<Select value={mode} onChange={e=>{setMode(e.target.value as "ON_CAMPUS"|"VIRTUAL");setVenue("");setMeetingUrl("");setFieldErrors({});setDirty(true);}}
     className="w-full">
     <option value="ON_CAMPUS">Offline</option><option value="VIRTUAL">Online</option></Select></label>
    <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] text-[13px]">{mode==="VIRTUAL"?"Meeting Link":"Venue Address"}
     <Input value={mode==="VIRTUAL"?meetingUrl:venue} maxLength={500}
      placeholder={mode==="VIRTUAL"?"https://meet.example.com/...":"Enter interview venue address"}
      onChange={e=>{mode==="VIRTUAL"?setMeetingUrl(e.target.value):setVenue(e.target.value);setDirty(true);}}
      className="w-full"/>
     {fieldErrors[mode==="VIRTUAL"?"meetingUrl":"venue"]?<span role="alert" className="text-xs text-error">{fieldErrors[mode==="VIRTUAL"?"meetingUrl":"venue"]}</span>:null}
     </label>
    <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] text-[13px]">
      Interviewer(s) <span className="text-xs font-normal text-muted-foreground">Use the same spelling as existing interviews to avoid double-booking.</span>
     <Input value={interviewer} list={"interviewer-suggestions-"+jobId} maxLength={255}
      placeholder="Start typing an interviewer’s name" autoComplete="off"
      onChange={e=>{setInterviewer(e.target.value);setDirty(true);}} className="w-full"/>
     <datalist id={"interviewer-suggestions-"+jobId}>
      {interviewerNames.filter(name=>name.toLowerCase().includes(interviewer.toLowerCase())).slice(0,30).map(name=>
        <option key={name} value={name}/>)}
     </datalist>
     {nearInterviewer?<span role="status" className="text-xs text-warning">Existing name uses “{nearInterviewer}”. Select the existing spelling.</span>:null}
     </label>
    <p className="text-xs text-muted-foreground">Times shown in Asia/Kolkata (IST). The server checks other drives and interviewer conflicts before accepting a slot.</p>
    {previewConflicts.length>0?<Banner tone="warning" role="alert">
      Possible scheduling conflict with {previewConflicts.length} interview{previewConflicts.length===1?"":"s"} in this drive, including a 15-minute buffer. Check the candidate, room and interviewer. The server also checks other drives before saving.
    </Banner>:null}
    {editing?<label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] text-[13px]">Reason for change<Textarea rows={2} value={reason}
     onChange={e=>{setReason(e.target.value);setDirty(true);}} className="w-full"/></label>:null}
    {error?<Banner tone="error" action={<Button type="button" size="sm"
      variant="secondary" onClick={()=>setError("")}>Dismiss</Button>}>
      <strong>Interview was not scheduled.</strong> {error}
    </Banner>:null}

  </Dialog>
  <Dialog open={feedbackFor!==null} onOpenChange={next=>{if(!next){
   if(feedbackBusy)showToast({tone:"info",title:"Wait for feedback submission to finish."});
   else setFeedbackFor(null);
  }}} title="Interview feedback" description="Staff-only review. Rating and recommendation do not update selection results."
   dismissible={true}
   footer={<>
    {!feedbackExisting?<Button type="button" disabled={feedbackBusy||
     feedbackError.startsWith("Unable to load")||feedbackComments.trim().length<3}
     onClick={()=>void submitFeedback()}>{feedbackBusy?"Submitting…":"Submit feedback"}</Button>:null}
    <Button type="button" variant="secondary" onClick={()=>{
     if(feedbackBusy){showToast({tone:"info",title:"Wait for feedback submission to finish."});return;}
     setFeedbackFor(null);
    }}>Close</Button>
   </>}>
   {feedbackBusy?<p role="status">Loading interview feedback…</p>:null}
   {feedbackExisting?<div className="space-y-2 text-sm">
    <p className="font-semibold">Feedback already submitted</p>
    <p>Rating: {feedbackExisting.rating} / 5</p>
    <p>Recommendation: {feedbackExisting.recommendation}</p>
    <p className="whitespace-pre-wrap">Comments: {feedbackExisting.comments}</p>
    <p className="text-xs text-muted-foreground">Recorded on {display(feedbackExisting.createdAt)}</p>
   </div>:!feedbackBusy?<>
    <label className="grid gap-2 text-[13px] font-semibold">Rating (1–5)
     <Select value={String(feedbackRating)} onChange={event=>setFeedbackRating(Number(event.target.value))}>
      {[1,2,3,4,5].map(value=><option key={value} value={value}>{value} / 5</option>)}
     </Select>
    </label>
    <label className="mt-3 grid gap-2 text-[13px] font-semibold">Recommendation
     <Select value={feedbackRecommendation} onChange={event=>
      setFeedbackRecommendation(event.target.value as typeof feedbackRecommendation)}>
      <option value="SELECT">Recommend selecting</option>
      <option value="HOLD">Hold for review</option>
      <option value="REJECT">Recommend not selecting</option>
     </Select>
    </label>
    <label className="mt-3 grid gap-2 text-[13px] font-semibold">Feedback comments
     <Textarea value={feedbackComments} rows={4} maxLength={5000}
      onChange={event=>setFeedbackComments(event.target.value)}/>
    </label>
   </>:null}
   {feedbackError?<Banner tone="error" action={<Button type="button" size="sm"
    variant="secondary" onClick={()=>feedbackFor&&void openFeedback(feedbackFor)}>
    Retry</Button>}>{feedbackError}</Banner>:null}
  </Dialog>
  <ConfirmDialog open={confirmDiscard} onOpenChange={setConfirmDiscard}
   title="Discard interview setup?"
   description="There are unsaved interview changes."
   confirmLabel="Discard changes" cancelLabel="Keep editing"
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

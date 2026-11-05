"use client";
import {useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {facultyAttendanceMarkingWindow} from "@/modules/attendance/faculty-marking-window";
import {facultyAttendanceWriteNeedsReload} from "@/modules/attendance/faculty-attendance-write-recovery";
import {selectFacultyPrototypeSession} from "@/modules/attendance/faculty-prototype-session-selection";
import type {FacultyAttendanceWorkspaceData} from "./faculty-attendance-workspace";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { TextLink } from "@/components/ui/text-link";
import { Label } from "@/components/ui/label";

type AttendanceMark="PRESENT"|"ABSENT";
type Session=FacultyAttendanceWorkspaceData["sessions"][number];
const sessionLabel=(date:string)=>new Intl.DateTimeFormat("en-IN",{
 timeZone:"Asia/Kolkata",weekday:"long",day:"numeric",month:"short",
 hour:"numeric",minute:"2-digit",
}).format(new Date(date));
const monthLabel=(date:string)=>new Intl.DateTimeFormat("en-IN",{
 timeZone:"Asia/Kolkata",month:"long",year:"numeric",
}).format(new Date(date));
function existingMarks(workspace:FacultyAttendanceWorkspaceData,selected:Session|null){
 const result=new Map<string,AttendanceMark>();
 if(selected?.attendanceStatus!=="MARKED")return result;
 const exceptions=new Map(workspace.records.filter(r=>r.scheduleEventId===selected.id)
  .map(r=>[r.membershipId,r.status] as const));
 for(const learner of workspace.roster)result.set(learner.membershipId,
  exceptions.get(learner.membershipId)==="PRESENT"||!exceptions.has(learner.membershipId)?
   "PRESENT":"ABSENT");
 return result;
}

/** Direct Faculty screenshot marking surface. The persisted vNext API requires
 * an explicit full-roster partition; never silently count an unmarked learner
 * as present. Confirmation and the versioned correction contract remain intact. */
export function FacultyPrototypeAttendance({workspace,deliveryId,selectedSessionId}:{
 workspace:FacultyAttendanceWorkspaceData;deliveryId:string;selectedSessionId:string|null;
}){
 const router=useRouter();
 const base="/teacher/courses/"+encodeURIComponent(deliveryId)+"/attendanceDetail";
 const sessions=[...workspace.sessions].sort((a,b)=>b.startsAt.localeCompare(a.startsAt));
 const selected=selectFacultyPrototypeSession(sessions,selectedSessionId);
 const [marks,setMarks]=useState(()=>existingMarks(workspace,selected));
 const [search,setSearch]=useState("");
 const [allVisible,setAllVisible]=useState(false);
 const [view,setView]=useState<"mark"|"month">("mark");
 const [correctionReason,setCorrectionReason]=useState("");
 const [confirming,setConfirming]=useState(false);
 const [submitting,setSubmitting]=useState(false);
 const [outcomeUncertain,setOutcomeUncertain]=useState(false);
 const [error,setError]=useState<string|null>(null);
 const [success,setSuccess]=useState<string|null>(null);
 const pendingRef=useRef(false);
 useEffect(()=>{setMarks(existingMarks(workspace,selected));setError(null);setSuccess(null);
  setOutcomeUncertain(false);setConfirming(false);
 },[workspace,selected?.id]);
 // Selecting a specific date from This month must return to marking mode.
 useEffect(()=>{if(selectedSessionId)setView("mark");},[selectedSessionId]);
 const scopeRecords=workspace.roster;
 const normalized=search.trim().normalize("NFKC").toLocaleLowerCase("en-IN");
 const filtered=scopeRecords.filter(s=>!normalized||[
  s.displayName,s.rollNumber].some(v=>v?.normalize("NFKC").toLocaleLowerCase("en-IN").includes(normalized)));
 const visible=allVisible||normalized?filtered:filtered.slice(0,6);
 const markedPresent=[...marks.values()].filter(v=>v==="PRESENT").length;
 const markedAbsent=[...marks.values()].filter(v=>v==="ABSENT").length;
 const unmarked=scopeRecords.length-markedPresent-markedAbsent;
 const initial=existingMarks(workspace,selected);
 const changed=scopeRecords.some(item=>marks.get(item.membershipId)!==initial.get(item.membershipId));
 const timing=selected?facultyAttendanceMarkingWindow({
  startsAt:new Date(selected.startsAt),endsAt:new Date(selected.endsAt),
  correctionWindowHours:workspace.policy.correctionWindowHours,now:new Date(),
 }):null;
 const writable=timing==="OPEN"&&!submitting&&!outcomeUncertain;
 const selectedHref=(sessionId:string)=>base+"?sessionId="+encodeURIComponent(sessionId);
 function setMark(id:string,mark:AttendanceMark){
  if(!writable)return;
  setError(null);setSuccess(null);
  setMarks(old=>new Map(old).set(id,mark));
 }
 function beforeSubmit(){
  if(!selected||!writable)return;
  setError(null);
  if(scopeRecords.length===0){setError("No enrolled learners for this class.");return;}
  if(unmarked!==0){
   setError("Mark the remaining "+unmarked+" students present or absent before submission. The server does not silently mark unmarked students.");
   return;
  }
  if(selected.attendanceStatus==="MARKED"&&!changed){
   setError("No attendance marks have changed. There is nothing to correct.");return;
  }
  if(selected.attendanceStatus==="MARKED"&&correctionReason.trim().length<8){
   setError("Explain this attendance correction in at least 8 characters.");return;
  }
  setConfirming(true);
 }
 async function submit(){
  if(!selected||!writable||pendingRef.current)return;
  if(marks.size!==scopeRecords.length)return;
  setConfirming(false);pendingRef.current=true;setSubmitting(true);setError(null);
  try{
   const response=await fetch("/api/attendance/faculty/sessions/"+encodeURIComponent(selected.id),{
    method:"PATCH",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
     deliveryId,
     presentMembershipIds:scopeRecords.filter(s=>marks.get(s.membershipId)==="PRESENT").map(s=>s.membershipId),
     absentMembershipIds:scopeRecords.filter(s=>marks.get(s.membershipId)==="ABSENT").map(s=>s.membershipId),
     ...(selected.attendanceStatus==="MARKED"?{
      expectedMarkedAt:selected.markedAt,correctionReason:correctionReason.trim(),
     }:{}),
    }),
   });
   if(!response.ok){
    // A 5xx or stale-version response can arrive after the attendance write
    // committed. Never offer a second save from the same roster snapshot.
    const mustReload=facultyAttendanceWriteNeedsReload(response.status);
    if(mustReload)setOutcomeUncertain(true);
    setError(response.status===409||response.status===412?
     "Attendance changed or conflicted. Refresh the session before correcting again.":
     response.status===403||response.status===404?
      "This class session is not available to your current Faculty assignment.":
     mustReload?"The attendance save could not be confirmed. Refresh this session before trying again.":
     "Attendance could not be saved. Review the class and try again.");
    return;
   }
   setSuccess("Attendance saved for "+scopeRecords.length+" enrolled learners.");
   setCorrectionReason("");
   setOutcomeUncertain(true);
   router.refresh();
  }catch{
   setOutcomeUncertain(true);
   setError("The save outcome is unknown. Refresh the class session before retrying.");
  }finally{pendingRef.current=false;setSubmitting(false);}
 }
 return <section aria-label="Faculty prototype attendance" className="space-y-4">
  <div className="flex flex-wrap items-center justify-between gap-3">
   <div className="flex flex-wrap gap-2" role="group" aria-label="Attendance view">
    <Button variant="chip" type="button" aria-pressed={view==="mark"}
     onClick={()=>setView("mark")}>Mark attendance</Button>
    <Button variant="chip" type="button" aria-pressed={view==="month"}
     onClick={()=>setView("month")}>This month</Button>
   </div>
  </div>
  {view==="month"?<section className="rounded-xl border border-[color:var(--lms-border)] p-5">
   <Heading level={2} size="base" className="text-[color:var(--lms-heading)]">{monthLabel(new Date().toISOString())} attendance</Heading>
   <p className="faculty-proto-subtitle mt-1">Review the scheduled classes and open one to mark or correct its attendance.</p>
   {sessions.some(s=>monthLabel(s.startsAt)===monthLabel(new Date().toISOString()))?null:
    <p role="status" className="faculty-proto-subtitle mt-3">No class sessions scheduled for this month.</p>}
   <ol className="mt-3 divide-y divide-[color:var(--lms-neutral-100)]">{sessions.filter(s=>
    monthLabel(s.startsAt)===monthLabel(new Date().toISOString())).map(s=><li key={s.id}
    className="flex flex-wrap items-center justify-between gap-4 py-3 text-sm">
    <span>{sessionLabel(s.startsAt)} · {s.title}</span>
    <TextLink variant="bare" className="faculty-proto-link" href={selectedHref(s.id)}>
     {s.attendanceStatus==="MARKED"?"Review marks":"Mark attendance"}</TextLink>
   </li>)}</ol>
   <TextLink variant="bare" className="faculty-proto-link mt-3 inline-block" href="#faculty-attendance-editor">Open detailed monthly report below</TextLink>
  </section>:!selected?
  <div className="rounded-xl border border-[color:var(--lms-border)] p-6">
   <Heading level={2} size="base">No class session scheduled yet</Heading>
   <p className="faculty-proto-subtitle mt-1">Schedule a class from the full attendance workspace.</p>
   <TextLink variant="bare" className="faculty-proto-link mt-2 inline-block" href="#faculty-attendance-editor">Open attendance tools</TextLink>
  </div>:
  <div className="overflow-hidden rounded-xl border border-[color:var(--lms-border)]">
   <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[color:var(--lms-border)] p-4">
    <div><Heading level={2} size="base" className="text-[color:var(--lms-heading)]">{sessionLabel(selected.startsAt)} · {selected.location??"Room not assigned"}</Heading>
     <p className="faculty-proto-subtitle mt-1">{markedPresent} present, {markedAbsent} absent, {unmarked} not marked</p></div>
    <div className="flex flex-wrap gap-2">
     <Label className="sr-only" htmlFor="faculty-attendance-search">Find a student by name</Label>
     <Input id="faculty-attendance-search" value={search} onChange={e=>setSearch(e.target.value)}
      placeholder="Find a student by name" className="min-h-11 rounded-lg border border-[color:var(--lms-border)] bg-surface px-3 text-sm"/>
     <Button variant="secondary" type="button" onClick={()=>setMarks(new Map(scopeRecords.map(s=>[s.membershipId,"PRESENT" as const])))}
      disabled={!writable||!scopeRecords.length}>Mark everyone present</Button>
     <TextLink variant="bare" className="faculty-proto-secondary" href={base+"?sessionId="+encodeURIComponent(selected.id)+"&schedule=1#faculty-attendance-scheduling"}>Schedule a class</TextLink>
    </div>
   </div>
   <ul className="divide-y divide-[color:var(--lms-neutral-100)]">{visible.map(student=>{
    const mark=marks.get(student.membershipId)??null;
    const name=student.displayName?.trim()||"Student";
    const words=name.split(/\s+/).filter(Boolean);
    const initials=((words[0]?.[0]??"")+(words.at(-1)?.[0]??"")).toUpperCase()||"ST";
    return <li key={student.membershipId} className="flex min-h-14 items-center justify-between gap-3 px-4 py-2">
     <div className="flex min-w-0 items-center gap-3">
      <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color:var(--lms-primary-subtle)] text-xs font-bold text-[color:var(--lms-button-primary)]">{initials}</span>
      <span className="min-w-0"><strong className="text-sm text-[color:var(--lms-heading)]">{name}</strong>
       <span className="ml-1.5 text-xs text-[color:var(--lms-text-muted)]">{student.rollNumber??"Roll not assigned"}</span></span>
     </div>
     <div className="flex shrink-0 gap-1.5" role="group" aria-label={"Attendance for "+name}>
      {(["PRESENT","ABSENT"] as const).map(option=><Button variant="bare" key={option} type="button"
       onClick={()=>setMark(student.membershipId,option)} disabled={!writable}
       aria-pressed={mark===option} className={"faculty-proto-pill min-h-11 px-3 "+
        (mark===option?(option==="PRESENT"?"border-[color:var(--lms-success-strong)] bg-[color:var(--lms-success-surface)] text-[color:var(--lms-success-strong)]":
         "border-[color:var(--lms-error)] bg-[color:var(--lms-error-surface)] text-[color:var(--lms-error-text)]"):"")}>
        {option==="PRESENT"?"Present":"Absent"}</Button>)}
     </div>
    </li>;
   })}</ul>
   {filtered.length===0?<p className="faculty-proto-subtitle p-5">No students match your search.</p>:null}
   {filtered.length>visible.length?<Button variant="bare" type="button" className="faculty-proto-link mx-4 my-3"
    onClick={()=>setAllVisible(true)}>Show all {filtered.length} students</Button>:null}
   {selected.attendanceStatus==="MARKED"&&changed?
    <div className="border-t border-[color:var(--lms-border)] px-4 py-3">
     <Label htmlFor="faculty-attendance-correction-reason" className="block">Reason for correcting recorded attendance</Label>
     <Textarea id="faculty-attendance-correction-reason" rows={2} value={correctionReason}
      onChange={e=>setCorrectionReason(e.target.value)} maxLength={500}
      className="mt-1 w-full rounded-lg border border-[color:var(--lms-border)] p-3 text-sm" placeholder="What changed in the recorded attendance?"/>
    </div>:null}
   {error?<p role="alert" className="m-4 rounded-lg bg-[color:var(--lms-error-surface)] p-3 text-sm text-[color:var(--lms-error-strong)]">{error}</p>:null}
   {success?<p role="status" className="m-4 rounded-lg bg-[color:var(--lms-success-surface)] p-3 text-sm text-[color:var(--lms-success-strong)]">{success}</p>:null}
   {timing!=="OPEN"?<p className="faculty-proto-subtitle px-4 pb-3">
    {timing==="NOT_STARTED"?"Marking opens when the class starts.":"Faculty attendance correction window is closed; contact your college administrator."}
   </p>:null}
   <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-[color:var(--lms-border)] bg-[color:var(--lms-neutral-50)] px-4 py-4">
    <p className="faculty-proto-subtitle">Showing {visible.length} of {scopeRecords.length}.
     {unmarked>0?" "+unmarked+" unmarked; each learner must be explicitly marked before saving.":""}</p>
    <div className="flex flex-wrap gap-2">
     {outcomeUncertain?<Button variant="secondary" type="button" onClick={()=>router.refresh()}>Refresh attendance</Button>:null}
     <Button variant="primary" type="button" disabled={!writable||unmarked!==0||!changed}
      onClick={beforeSubmit}>{submitting?"Submitting…":selected.attendanceStatus==="MARKED"?"Submit correction":"Submit attendance"}</Button>
    </div>
   </footer>
  </div>}
  {confirming&&selected?<div className="fixed inset-0 z-(--lms-z-overlay) flex items-center justify-center bg-[color:color-mix(in_srgb,var(--lms-black)_40%,transparent)] p-4">
   <div role="alertdialog" aria-modal="true" aria-labelledby="faculty-attendance-confirm-title"
    className="w-full max-w-md rounded-xl bg-surface p-6 shadow-xl">
    <Heading level={2} size="lg" id="faculty-attendance-confirm-title" className="text-[color:var(--lms-heading)]">
     {selected.attendanceStatus==="MARKED"?"Confirm attendance correction":"Submit attendance?"}</Heading>
    <p className="faculty-proto-subtitle my-3">Save {markedPresent} present and {markedAbsent} absent marks for the complete roster?
     {selected.attendanceStatus==="MARKED"?" This creates an audited correction.":""}</p>
    <div className="flex justify-end gap-2">
     <Button variant="secondary" type="button" onClick={()=>setConfirming(false)}>Cancel</Button>
     <Button variant="primary" type="button" onClick={()=>void submit()}>Confirm and save</Button>
    </div>
   </div>
  </div>:null}
  {sessions.length>1&&view==="mark"?<div className="flex flex-wrap gap-2">
   <span className="self-center text-xs font-bold text-[color:var(--lms-text-muted)]">Other class sessions</span>
   {sessions.slice(0,6).map(session=><TextLink key={session.id} href={selectedHref(session.id)}
    className="faculty-proto-pill"
    aria-current={session.id===selected?.id?"page":undefined}>
    {new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",day:"numeric",month:"short"}).format(new Date(session.startsAt))}</TextLink>)}
  </div>:null}
 </section>;
}

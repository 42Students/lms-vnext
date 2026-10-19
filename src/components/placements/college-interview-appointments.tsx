"use client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {DataTable} from "@/components/ui/data-table";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {Dialog} from "@/components/ui/dialog";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {collegeInterviewIcs} from "@/modules/placements/college-interview-calendar-model";
type Round={id:string;name:string;status:string;kind:string};
type Candidate={applicationId:string;name:string|null;screening:string};
type Appointment={id:string;roundId:string;applicationId:string;status:string;scheduledAt:string;
 durationMinutes:number;mode:string;venue:string|null;meetingUrl:string|null;
 interviewer:string|null;outcomeNote:string|null;version:number};
const display=(iso:string)=>new Intl.DateTimeFormat("en-IN",{
 dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata",
}).format(new Date(iso))+" IST";
const toLocal=(iso:string)=>new Intl.DateTimeFormat("sv-SE",{
 year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",
 hourCycle:"h23",timeZone:"Asia/Kolkata",
}).format(new Date(iso)).replace(" ","T");
export function CollegeInterviewAppointments({jobId,rounds,candidates,appointments,preferredApplicationId}:{
 jobId:string;rounds:Round[];candidates:Candidate[];appointments:Appointment[];preferredApplicationId?:string;
}){
 const router=useRouter();const [editing,setEditing]=useState<Appointment|null>(null);
 const [show,setShow]=useState(false);const [roundId,setRoundId]=useState(rounds[0]?.id??"");
 const [applicationId,setApplicationId]=useState(candidates.find(c=>c.applicationId===preferredApplicationId)?.applicationId??candidates[0]?.applicationId??"");
 const [start,setStart]=useState("");const [duration,setDuration]=useState(30);
 const [mode,setMode]=useState<"ON_CAMPUS"|"VIRTUAL">("ON_CAMPUS");
 const [venue,setVenue]=useState("");const [meetingUrl,setMeetingUrl]=useState("");
 const [interviewer,setInterviewer]=useState("");const [reason,setReason]=useState("");
 const [busy,setBusy]=useState(false);const [error,setError]=useState("");
 const [success,setSuccess]=useState("");
 const [decision,setDecision]=useState<{row:Appointment;action:"CANCEL"|"COMPLETED"|"NO_SHOW"}|null>(null);
 const [decisionReason,setDecisionReason]=useState("");
 function open(row?:Appointment){
  setEditing(row??null);setRoundId(row?.roundId??rounds[0]?.id??"");
  setApplicationId(row?.applicationId??candidates.find(c=>c.applicationId===preferredApplicationId)?.applicationId??candidates[0]?.applicationId??"");
  setStart(row?toLocal(row.scheduledAt):"");setDuration(row?.durationMinutes??30);
  setMode(row?.mode==="VIRTUAL"?"VIRTUAL":"ON_CAMPUS");
  setVenue(row?.venue??"");setMeetingUrl(row?.meetingUrl??"");
  setInterviewer(row?.interviewer??"");setReason("");
  setError("");setSuccess("");setShow(true);
 }
 async function post(body:Record<string,unknown>){
  if(busy)return false;
  setBusy(true);setError("");setSuccess("");
  try{
   const data=await apiFetch<{status?:string}>("/api/placements/college/jobs/"+encodeURIComponent(jobId)+"/interviews",{
    method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},
    body:JSON.stringify({...body,confirmed:true}),
   });
   setSuccess(body.action==="SCHEDULE"?"Interview scheduled and candidate notified." :
    "Interview "+(data.status??"updated").toLowerCase().replaceAll("_"," ")+". The learner was notified.");
   router.refresh();return true;
  }catch(e){setError(e instanceof Error?e.message:"Interview action failed");return false;}
  finally{setBusy(false);}
 }
 async function save(){
  if(!start||!applicationId||!roundId)return;
  const iso=new Date(start+"+05:30").toISOString();
  const appointment={roundId,applicationId,scheduledAt:iso,durationMinutes:duration,
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
 return <section className="space-y-4 border-b border-border pb-5">
  <div className="flex flex-wrap items-center justify-between gap-3">
   <div><h2 className="text-lg font-semibold">Candidate interviews</h2>
    <p className="mt-1 text-sm text-body">Schedule, edit, cancel, mark Completed or No Show. Actions are audited and notify the learner.</p></div>
   <Button type="button" disabled={!available.length||!candidates.length} onClick={()=>open()}
    >Schedule interview</Button>
  </div>
  {!available.length||!candidates.length?<p role="status" className="text-sm text-body">Schedule an interview when a pending or scheduled round and a candidate are available.</p>:null}
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
      {key:"status",header:"Status",mobilePriority:"secondary",cell:row=>row.status},
      {key:"actions",header:"Actions",mobilePriority:"action",
        cell:row=><div className="flex flex-wrap gap-2">
     {row.status!=="CANCELLED"?<a download={"interview-"+row.id+".ics"}
      href={"data:text/calendar;charset=utf-8,"+encodeURIComponent(collegeInterviewIcs({
       id:row.id,title:"College interview",date:row.scheduledAt,
       durationMinutes:row.durationMinutes,location:row.venue??row.meetingUrl,
      }))} className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-[var(--lms-teal-deep)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]">
      Download .ics</a>:null}
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
    </div>},
    ]}
    empty={<p role="status" className="text-sm text-body">No candidate interviews have been scheduled for this drive.</p>}
  />
  {success?<p role="status" className="text-sm text-body">{success}</p>:null}
  {error&&!show?<p role="alert" className="text-sm text-foreground">{error}</p>:null}
  <Dialog open={show} onOpenChange={next=>{if(!next&&!busy)setShow(false);}} title={editing?"Edit interview":"Schedule interview"} dismissible={!busy}>
    <h3 className="text-lg font-semibold">{editing?"Edit interview":"Schedule interview"}</h3>
    <label className="grid gap-1 text-sm">Round<Select value={roundId} disabled={Boolean(editing)}
     onChange={e=>setRoundId(e.target.value)} className="w-full">
     {available.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}
    </Select></label>
    <label className="grid gap-1 text-sm">Candidate<Select value={applicationId} disabled={Boolean(editing)}
     onChange={e=>setApplicationId(e.target.value)} className="w-full">
     {candidates.map(c=><option key={c.applicationId} value={c.applicationId}>{c.name??"Learner"} · {c.screening}</option>)}
    </Select></label>
    <div className="grid gap-3 sm:grid-cols-2">
     <label className="grid gap-1 text-sm">Date & time (IST)<Input type="datetime-local" required value={start}
      onChange={e=>setStart(e.target.value)} className="w-full"/></label>
     <label className="grid gap-1 text-sm">Duration (minutes)<Input type="number" min={5} max={480} value={duration}
      onChange={e=>setDuration(Number(e.target.value))} className="w-full"/></label>
    </div>
    <label className="grid gap-1 text-sm">Mode<Select value={mode} onChange={e=>setMode(e.target.value as "ON_CAMPUS"|"VIRTUAL")}
     className="w-full">
     <option value="ON_CAMPUS">On campus</option><option value="VIRTUAL">Virtual</option></Select></label>
    <label className="grid gap-1 text-sm">{mode==="VIRTUAL"?"Secure meeting URL":"Interview location"}
     <Input value={mode==="VIRTUAL"?meetingUrl:venue} onChange={e=>mode==="VIRTUAL"?setMeetingUrl(e.target.value):setVenue(e.target.value)}
      className="w-full"/></label>
    <label className="grid gap-1 text-sm">Interviewer (optional)<Input value={interviewer}
     onChange={e=>setInterviewer(e.target.value)} className="w-full"/></label>
    {editing?<label className="grid gap-1 text-sm">Reason for change<Textarea rows={2} value={reason}
     onChange={e=>setReason(e.target.value)} className="w-full"/></label>:null}
    {error?<p role="alert" className="text-sm text-foreground">{error}</p>:null}
    <div className="flex flex-wrap gap-3">
     <Button type="button" disabled={busy||!start||(Boolean(editing)&&reason.trim().length<3)}
      onClick={()=>void save()} >
      {busy?"Saving…":editing?"Save interview":"Schedule and notify"}</Button>
     <Button type="button" disabled={busy} variant="secondary" onClick={()=>setShow(false)}
      >Cancel</Button>
    </div>
  </Dialog>
  <ConfirmDialog open={decision!==null} onOpenChange={open=>{if(!open&&!busy)setDecision(null);}}
   title={decision?.action==="CANCEL"?"Cancel interview?":decision?.action==="NO_SHOW"?"Mark No Show?":"Mark interview completed?"}
   description="This action is recorded and the learner will be notified."
   confirmLabel="Save decision" pending={busy} confirmDisabled={decisionReason.trim().length<3}
   onConfirm={()=>void confirmDecision()}>
   <label className="grid gap-1 text-sm font-semibold">Reason or outcome note
    <Textarea rows={3} value={decisionReason} onChange={e=>setDecisionReason(e.target.value)}
     className="w-full" /></label>
  </ConfirmDialog>
 </section>;
}

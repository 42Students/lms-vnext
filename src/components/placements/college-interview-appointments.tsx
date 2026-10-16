"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
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
export function CollegeInterviewAppointments({jobId,rounds,candidates,appointments}:{
 jobId:string;rounds:Round[];candidates:Candidate[];appointments:Appointment[];
}){
 const router=useRouter();const [editing,setEditing]=useState<Appointment|null>(null);
 const [show,setShow]=useState(false);const [roundId,setRoundId]=useState(rounds[0]?.id??"");
 const [applicationId,setApplicationId]=useState(candidates[0]?.applicationId??"");
 const [start,setStart]=useState("");const [duration,setDuration]=useState(30);
 const [mode,setMode]=useState<"ON_CAMPUS"|"VIRTUAL">("ON_CAMPUS");
 const [venue,setVenue]=useState("");const [meetingUrl,setMeetingUrl]=useState("");
 const [interviewer,setInterviewer]=useState("");const [reason,setReason]=useState("");
 const [busy,setBusy]=useState(false);const [error,setError]=useState("");
 const [success,setSuccess]=useState("");
 function open(row?:Appointment){
  setEditing(row??null);setRoundId(row?.roundId??rounds[0]?.id??"");
  setApplicationId(row?.applicationId??candidates[0]?.applicationId??"");
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
   const response=await fetch("/api/placements/college/jobs/"+encodeURIComponent(jobId)+"/interviews",{
    method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},
    body:JSON.stringify({...body,confirmed:true}),
   });
   const data=await response.json() as {error?:string;issues?:Array<{message:string}>;status?:string};
   if(!response.ok)throw Error(data.issues?.[0]?.message??data.error??"Could not update the interview");
   setSuccess("Interview "+(data.status??"updated").toLowerCase().replaceAll("_"," ")+". The learner was notified.");
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
 async function decide(row:Appointment,action:"CANCEL"|"COMPLETED"|"NO_SHOW"){
  const note=window.prompt(action==="CANCEL"?"Why is the interview being cancelled?":
   action==="COMPLETED"?"Confirm the completed interview and enter an outcome note":
    "Why is the learner marked as No Show?");
  if(!note||note.trim().length<3)return;
  await post({action,interviewId:row.id,expectedVersion:row.version,reason:note.trim()});
 }
 const available=rounds.filter(r=>["SCHEDULED","PENDING"].includes(r.status));
 return <section className="space-y-4 rounded-xl border border-border bg-surface p-5">
  <div className="flex flex-wrap items-center justify-between gap-3">
   <div><h2 className="text-lg font-semibold">Candidate interviews</h2>
    <p className="mt-1 text-sm text-body">Schedule, edit, cancel, mark Completed or No Show. Actions are audited and notify the learner.</p></div>
   <button type="button" disabled={!available.length||!candidates.length} onClick={()=>open()}
    className="min-h-11 rounded bg-primary px-4 font-semibold text-on-primary disabled:opacity-50">Schedule interview</button>
  </div>
  <div className="overflow-x-auto"><table className="min-w-full text-left text-sm">
   <thead><tr className="border-b border-border bg-muted"><th className="p-3">Candidate</th><th className="p-3">Round</th>
    <th className="p-3">Date & Time (IST)</th><th className="p-3">Mode and location</th>
    <th className="p-3">Interviewer</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr></thead>
   <tbody>{appointments.map(row=><tr key={row.id} className="border-b border-border">
    <td className="p-3">{candidates.find(c=>c.applicationId===row.applicationId)?.name??row.applicationId}</td>
    <td className="p-3">{rounds.find(r=>r.id===row.roundId)?.name??"Interview round"}</td>
    <td className="p-3">{display(row.scheduledAt)} · {row.durationMinutes} min</td>
    <td className="p-3">{row.mode==="VIRTUAL"?"Virtual":"On campus"} · {row.venue??row.meetingUrl??"—"}</td>
    <td className="p-3">{row.interviewer??"Not recorded"}</td><td className="p-3">{row.status}</td>
    <td className="p-3"><div className="flex flex-wrap gap-2">
     {row.status==="SCHEDULED"?<>
      <button type="button" disabled={busy} onClick={()=>open(row)}
       className="min-h-10 rounded border border-border px-3 text-primary-text">Edit</button>
      <button type="button" disabled={busy} onClick={()=>void decide(row,"COMPLETED")}
       className="min-h-10 rounded border border-border px-3">Completed</button>
      <button type="button" disabled={busy} onClick={()=>void decide(row,"NO_SHOW")}
       className="min-h-10 rounded border border-border px-3">No Show</button>
      <button type="button" disabled={busy} onClick={()=>void decide(row,"CANCEL")}
       className="min-h-10 rounded border border-border px-3 text-error">Cancel</button>
     </>:<span className="text-body">Recorded</span>}
    </div></td>
   </tr>)}</tbody>
  </table></div>
  {!appointments.length?<p className="text-sm text-body">No candidate interviews have been scheduled for this drive.</p>:null}
  {success?<p role="status" className="text-sm text-body">{success}</p>:null}
  {error&&!show?<p role="alert" className="text-sm text-error">{error}</p>:null}
  {show?<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
   <div role="dialog" aria-modal="true" aria-label={editing?"Edit interview":"Schedule interview"}
    className="max-h-[90vh] w-full max-w-xl space-y-3 overflow-y-auto rounded-xl border border-border bg-surface p-6 shadow-xl">
    <h3 className="text-lg font-semibold">{editing?"Edit interview":"Schedule interview"}</h3>
    <label className="grid gap-1 text-sm">Round<select value={roundId} disabled={Boolean(editing)}
     onChange={e=>setRoundId(e.target.value)} className="min-h-11 rounded border border-border bg-surface px-3">
     {available.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}
    </select></label>
    <label className="grid gap-1 text-sm">Candidate<select value={applicationId} disabled={Boolean(editing)}
     onChange={e=>setApplicationId(e.target.value)} className="min-h-11 rounded border border-border bg-surface px-3">
     {candidates.map(c=><option key={c.applicationId} value={c.applicationId}>{c.name??"Learner"} · {c.screening}</option>)}
    </select></label>
    <div className="grid gap-3 sm:grid-cols-2">
     <label className="grid gap-1 text-sm">Date & time (IST)<input type="datetime-local" required value={start}
      onChange={e=>setStart(e.target.value)} className="min-h-11 rounded border border-border bg-surface px-3"/></label>
     <label className="grid gap-1 text-sm">Duration (minutes)<input type="number" min={5} max={480} value={duration}
      onChange={e=>setDuration(Number(e.target.value))} className="min-h-11 rounded border border-border bg-surface px-3"/></label>
    </div>
    <label className="grid gap-1 text-sm">Mode<select value={mode} onChange={e=>setMode(e.target.value as "ON_CAMPUS"|"VIRTUAL")}
     className="min-h-11 rounded border border-border bg-surface px-3">
     <option value="ON_CAMPUS">On campus</option><option value="VIRTUAL">Virtual</option></select></label>
    <label className="grid gap-1 text-sm">{mode==="VIRTUAL"?"Secure meeting URL":"Interview location"}
     <input value={mode==="VIRTUAL"?meetingUrl:venue} onChange={e=>mode==="VIRTUAL"?setMeetingUrl(e.target.value):setVenue(e.target.value)}
      className="min-h-11 rounded border border-border bg-surface px-3"/></label>
    <label className="grid gap-1 text-sm">Interviewer (optional)<input value={interviewer}
     onChange={e=>setInterviewer(e.target.value)} className="min-h-11 rounded border border-border bg-surface px-3"/></label>
    {editing?<label className="grid gap-1 text-sm">Reason for change<textarea rows={2} value={reason}
     onChange={e=>setReason(e.target.value)} className="rounded border border-border bg-surface p-3"/></label>:null}
    {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
    <div className="flex flex-wrap gap-3">
     <button type="button" disabled={busy||!start||(editing&&reason.trim().length<3)}
      onClick={()=>void save()} className="min-h-11 rounded bg-primary px-4 font-semibold text-on-primary disabled:opacity-50">
      {busy?"Saving…":editing?"Save interview":"Schedule and notify"}</button>
     <button type="button" disabled={busy} onClick={()=>setShow(false)}
      className="min-h-11 rounded border border-border px-4">Cancel</button>
    </div>
   </div>
  </div>:null}
 </section>;
}

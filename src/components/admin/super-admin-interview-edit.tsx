"use client";
import {useId,useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {Button} from "@/components/ui/button";
import {Dialog} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {Textarea} from "@/components/ui/textarea";
import {Banner} from "@/components/ui/banner";
import {useToast} from "@/components/ui/toast";
import {driveDeadlineIstToIso} from "@/modules/placements/tpo-drive-deadline-ist";

type Appointment={
 id:string;roundId:string;applicationId:string;status:string;
 scheduledAt:string;durationMinutes:number;mode:string;
 venue:string|null;meetingUrl:string|null;interviewer:string|null;
 version:number;interviewType?:string|null;roundDescription?:string|null;
 outcomeNote?:string|null;editNotes?:string|null;
};
type Type="SCREENING"|"TECHNICAL"|"HR"|"MANAGERIAL"|"FINAL";
const TYPES:Type[]=["SCREENING","TECHNICAL","HR","MANAGERIAL","FINAL"];
const toIstLocal=(value:string)=>new Intl.DateTimeFormat("sv-SE",{
 year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",
 hourCycle:"h23",timeZone:"Asia/Kolkata",
}).format(new Date(value)).replace(" ","T");

/** This client uses the existing College Admin mutation service, whose
 * acting-college branch verifies the real Super Admin and selected tenant.
 * It never accepts an arbitrary college ID from the browser. */
export function SuperAdminInterviewEdit({jobId,appointmentId,interviewers}:{
 jobId:string;appointmentId:string;interviewers:string[];
}){
 const router=useRouter();
 const {showToast}=useToast();
 const listId=useId();
 const [open,setOpen]=useState(false),[loading,setLoading]=useState(false);
 const [pending,setPending]=useState(false),[error,setError]=useState("");
 const [slot,setSlot]=useState<Appointment|null>(null);
 const [start,setStart]=useState(""),[duration,setDuration]=useState("60");
 const [mode,setMode]=useState<"ON_CAMPUS"|"VIRTUAL">("ON_CAMPUS");
 const [venue,setVenue]=useState(""),[meetingUrl,setMeetingUrl]=useState("");
 const [interviewer,setInterviewer]=useState("");
 const [interviewType,setInterviewType]=useState<Type>("SCREENING");
 const [description,setDescription]=useState(""),[notes,setNotes]=useState("");
 const [reason,setReason]=useState("");
 const [dirty,setDirty]=useState(false),[discard,setDiscard]=useState(false);
 const endpoint="/api/placements/college/jobs/"+encodeURIComponent(jobId)+"/interviews";
 async function edit(){
  setOpen(true);setLoading(true);setError("");setSlot(null);setDirty(false);setDiscard(false);
  try{
   const result=await apiFetch<{interviews:Appointment[]}>(endpoint,{cache:"no-store"});
   const found=result.interviews.find(row=>row.id===appointmentId);
   if(!found||!["SCHEDULED","RESCHEDULE_REQUESTED"].includes(found.status))
    throw new Error("Interview was not found in the active authorized appointments. Refresh and retry.");
   setSlot(found);setStart(toIstLocal(found.scheduledAt));
   setDuration(String(found.durationMinutes));setMode(found.mode==="VIRTUAL"?"VIRTUAL":"ON_CAMPUS");
   setVenue(found.venue??"");setMeetingUrl(found.meetingUrl??"");
   setInterviewer(found.interviewer??"");
   setInterviewType(TYPES.find(type=>type===found.interviewType)??"SCREENING");
   setDescription(found.roundDescription??"");
   setNotes(found.editNotes??"");setReason("");
  }catch(cause){setError(cause instanceof Error?cause.message:"Could not load interview.");}
  finally{setLoading(false);}
 }
 function close(){
  if(loading||pending)return;
  if(dirty){setDiscard(true);return;}
  setOpen(false);
 }
 async function save(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(!slot||pending||loading)return;
  if(description.trim().length<10||description.trim().length>500||
   interviewer.trim().length>255||notes.trim().length>1000||
   reason.trim().length<3||reason.trim().length>500){
   setError("Check the round description (10–500), interviewer (255), notes (1000) and change reason (3–500).");
   return;
  }
  const minutes=Number(duration);
  if(!Number.isInteger(minutes)||minutes<5||minutes>480){
   setError("Duration must be between 5 and 480 minutes.");return;
  }
  let scheduledAt:string;
  try{scheduledAt=driveDeadlineIstToIso(start);}
  catch{setError("Choose a valid future time in IST.");return;}
  if(new Date(scheduledAt).getTime()<=Date.now()){
   setError("The interview time must be in the future.");return;
  }
  if(mode==="ON_CAMPUS"&&venue.trim().length<2){
   setError("Enter the interview location.");return;
  }
  if(mode==="VIRTUAL"&&!/^https:\/\/\S+$/i.test(meetingUrl.trim())){
   setError("Enter a valid HTTPS meeting link.");return;
  }
  setPending(true);setError("");
  try{
   await apiFetch(endpoint,{method:"POST",
    headers:{"content-type":"application/json"},
    body:JSON.stringify({action:"EDIT",confirmed:true,interviewId:slot.id,
     expectedVersion:slot.version,reason:reason.trim(),notes:notes.trim(),
     appointment:{roundId:slot.roundId,applicationId:slot.applicationId,
      scheduledAt,durationMinutes:minutes,interviewType,
      roundDescription:description.trim(),mode,venue:mode==="ON_CAMPUS"?venue.trim():null,
      meetingUrl:mode==="VIRTUAL"?meetingUrl.trim():null,
      interviewer:interviewer.trim()||null}}),
   });
   showToast({tone:"success",title:"Interview updated",description:"Candidate notified of the schedule change."});
   setDirty(false);setOpen(false);router.refresh();
  }catch(cause){setError(cause instanceof Error?cause.message:"Interview update failed.");}
  finally{setPending(false);}
 }
 return <>
  <Button variant="secondary" size="sm" type="button" onClick={()=>void edit()}>Edit</Button>
  <Dialog open={open} onOpenChange={value=>{if(!value)close();}}
   title="Edit interview" className="max-w-[620px]" dismissible={!pending&&!loading}>
   {loading?<p role="status" className="py-4 text-sm">Loading interview details…</p>:
    slot?<form onChange={()=>setDirty(true)} onSubmit={event=>void save(event)} className="space-y-3">
     {slot.status==="RESCHEDULE_REQUESTED"?<Banner tone="warning" role="status">
      <strong>Reschedule requested.</strong> Review the candidate's request before saving.
      {slot.outcomeNote?<p className="mt-1 whitespace-pre-wrap">{slot.outcomeNote}</p>:null}
     </Banner>:null}
     <p className="text-xs text-muted-foreground">Changes affect the selected college only and are audited. The applicant receives a notification.</p>
     <div className="grid gap-3 sm:grid-cols-2">
      <label className="grid gap-1 text-sm font-semibold sm:col-span-2">Interview type
       <Select value={interviewType} onChange={event=>setInterviewType(event.target.value as Type)}>
        {TYPES.map(type=><option key={type} value={type}>{type}</option>)}
       </Select>
      </label>
      <label className="grid gap-1 text-sm font-semibold sm:col-span-2">What this round is about ({description.length}/500)
       <Textarea rows={3} minLength={10} maxLength={500} required value={description} onChange={event=>setDescription(event.target.value)}/>
      </label>
      <label className="grid gap-1 text-sm font-semibold sm:col-span-2">Interviewer
       <Input list={listId} maxLength={255} value={interviewer} onChange={event=>setInterviewer(event.target.value)}/>
       <datalist id={listId}>{[...new Set(interviewers)].map(name=><option key={name} value={name}/>)}</datalist>
      </label>
      <label className="grid gap-1 text-sm font-semibold">Duration (minutes)
       <Input type="number" min={5} max={480} required value={duration} onChange={event=>setDuration(event.target.value)}/>
      </label>
      <label className="grid gap-1 text-sm font-semibold">Date &amp; time (IST)
       <Input type="datetime-local" required step={300} value={start} onChange={event=>setStart(event.target.value)}/>
      </label>
      <label className="grid gap-1 text-sm font-semibold sm:col-span-2">Mode
       <Select value={mode} onChange={event=>setMode(event.target.value as typeof mode)}>
        <option value="ON_CAMPUS">On campus</option><option value="VIRTUAL">Virtual</option>
       </Select>
      </label>
      <label className="grid gap-1 text-sm font-semibold sm:col-span-2">
       {mode==="VIRTUAL"?"Meeting link (HTTPS)":"Venue"}
       <Input type={mode==="VIRTUAL"?"url":"text"} maxLength={500}
        value={mode==="VIRTUAL"?meetingUrl:venue}
        onChange={event=>mode==="VIRTUAL"?setMeetingUrl(event.target.value):setVenue(event.target.value)}/>
      </label>
      <label className="grid gap-1 text-sm font-semibold sm:col-span-2">Private interview notes ({notes.length}/1000)
       <Textarea rows={3} maxLength={1000} value={notes} onChange={event=>setNotes(event.target.value)}/>
      </label>
     </div>
     <label className="grid gap-1 text-sm font-semibold">Reason for change
      <Textarea rows={2} minLength={3} maxLength={500} required value={reason} onChange={event=>setReason(event.target.value)}/>
     </label>
     {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
     <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-3">
      <Button type="button" variant="secondary" disabled={pending} onClick={close}>Cancel</Button>
      <Button type="submit" loading={pending} disabled={pending||!dirty}>Save changes</Button>
     </div>
    </form>:<div className="space-y-3">
     <p role="alert" className="text-sm text-error">{error||"Interview unavailable."}</p>
     <Button type="button" variant="secondary" onClick={()=>void edit()}>Retry</Button>
    </div>}
  </Dialog>
  <Dialog open={discard} onOpenChange={setDiscard} title="Discard unsaved interview changes?">
   <div className="flex flex-wrap justify-end gap-2">
    <Button type="button" variant="secondary" onClick={()=>setDiscard(false)}>Keep editing</Button>
    <Button type="button" variant="danger" onClick={()=>{setDiscard(false);setDirty(false);setOpen(false);}}>Discard changes</Button>
   </div>
  </Dialog>
 </>;
}

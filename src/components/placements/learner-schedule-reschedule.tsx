"use client";
import { DateInput } from "@/components/ui/date-input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {useState} from "react";
import {useRouter} from "next/navigation";
export function LearnerScheduleReschedule({applicationId,roundId,mode,venue,meetingUrl}:{applicationId:string;roundId:string;mode:"ON_CAMPUS"|"VIRTUAL";venue:string|null;meetingUrl:string|null}){
 const router=useRouter();
 const [open,setOpen]=useState(false),[reason,setReason]=useState(""),[date,setDate]=useState("");
 const [nextMode,setNextMode]=useState(mode),[nextVenue,setNextVenue]=useState(venue??""),[nextUrl,setNextUrl]=useState(meetingUrl??"");
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[success,setSuccess]=useState("");
 async function save(){
  if(busy||reason.trim().length<3||reason.trim().length>900||!date)return;
  const when=new Date(date);
  if(!Number.isFinite(when.getTime())||when.getTime()<=Date.now()){setError("Choose a future preferred time.");return;}
  setBusy(true);setError("");setSuccess("");
  try{
   const response=await fetch("/api/placements/requests",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({requestType:"ROUND_RESCHEDULE",applicationId,roundId,
     reason:reason.trim(),scheduledAt:when.toISOString(),timezone:"Asia/Kolkata",mode:nextMode,
     venue:nextMode==="ON_CAMPUS"?nextVenue.trim()||null:null,
     meetingUrl:nextMode==="VIRTUAL"?nextUrl.trim()||null:null}),
   });
   if(!response.ok)throw Error("Request not sent. Check the time and contact details.");
   setOpen(false);setSuccess("Reschedule request sent. Your booking is unchanged until approved.");router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Could not send request.");}
  finally{setBusy(false);}
 }
 return <div className="mt-3 space-y-2">
  <button type="button" aria-expanded={open} onClick={()=>setOpen(x=>!x)}
    className="min-h-11 font-semibold text-primary-text underline">{open?"Cancel":"Can't make it? Ask to reschedule"}</button>
  {success?<p role="status" className="text-sm text-success">{success}</p>:null}
  {open?<div className="grid gap-3 rounded-[var(--lms-control-radius)] border border-border bg-surface-subtle p-3">
   <h4 className="font-semibold">Ask to reschedule</h4>
   <p className="text-sm text-body">The placement cell must approve your suggested time.</p>
   <label className="text-sm">Reason (3–900 characters)
    <Textarea value={reason} onChange={e=>setReason(e.target.value)} minLength={3} maxLength={900} rows={3}
      className="mt-1 min-h-24 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface p-3 text-sm text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-[var(--lms-focus-ring)]"/></label>
   <label className="text-sm">Preferred date and time
    <DateInput required mode="datetime-local" value={date} onChange={e=>setDate(e.target.value)}
      className="mt-1 min-h-11 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-[var(--lms-focus-ring)] sm:min-h-9"/></label>
   <label className="text-sm">Mode
    <Select value={nextMode} onChange={e=>setNextMode(e.target.value as typeof mode)}
      className="mt-1 min-h-11 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-[var(--lms-focus-ring)] sm:min-h-9">
     <option value="ON_CAMPUS">On campus</option><option value="VIRTUAL">Online</option>
    </Select></label>
   {nextMode==="ON_CAMPUS"?<label className="text-sm">Suggested venue
    <Input required value={nextVenue} maxLength={500} onChange={e=>setNextVenue(e.target.value)}
      className="mt-1 min-h-11 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-[var(--lms-focus-ring)] sm:min-h-9"/></label>:
    <label className="text-sm">Suggested meeting URL
     <Input required type="url" value={nextUrl} maxLength={2000} onChange={e=>setNextUrl(e.target.value)}
      className="mt-1 min-h-11 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-[var(--lms-focus-ring)] sm:min-h-9"/></label>}
   {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
   <button type="button" disabled={busy||reason.trim().length<3||!date||
     (nextMode==="ON_CAMPUS"?!nextVenue.trim():!/^https:\/\//i.test(nextUrl))}
     onClick={()=>void save()} className="min-h-11 rounded-[var(--lms-control-radius)] bg-[var(--lms-button-primary)] px-4 text-sm font-[650] text-[var(--lms-on-primary)] hover:bg-primary-hover disabled:opacity-50 sm:min-h-9">
    {busy?"Sending…":"Send request"}</button>
  </div>:null}
 </div>;
}

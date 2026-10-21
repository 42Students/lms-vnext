"use client";
import { DateInput } from "@/components/ui/date-input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {useToast} from "@/components/ui/toast";
import { apiFetch, FriendlyFetchError } from "@/lib/api-fetch";
export function LearnerScheduleReschedule({applicationId,roundId,mode,venue,meetingUrl}:{applicationId:string;roundId:string;mode:"ON_CAMPUS"|"VIRTUAL";venue:string|null;meetingUrl:string|null}){
 const router=useRouter();
 const {showToast}=useToast();
 const [open,setOpen]=useState(false),[reason,setReason]=useState(""),[date,setDate]=useState("");
 const [preferredTimes,setPreferredTimes]=useState("");
 const [nextMode,setNextMode]=useState(mode),[nextVenue,setNextVenue]=useState(venue??""),[nextUrl,setNextUrl]=useState(meetingUrl??"");
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[success,setSuccess]=useState("");
 // Keep free-text windows in the applicant-visible reason until the
 // request API has a separate approved preferredTimes field.
 const requestReason=reason.trim()+(preferredTimes.trim()?"\nTimes that work for you: "+preferredTimes.trim():"");
 async function save(){
  if(busy)return;
  if(reason.trim().length<3){
   setError("Enter a reason of at least 3 characters.");return;
  }
  if(requestReason.length>900){
   setError("Reason and preferred times must stay within 900 characters.");return;
  }
  if(!date){
   setError("Choose a future preferred time. You can add flexible windows as notes, but a proposed date is required for approval.");return;
  }
  // A datetime-local input has no timezone. Interpret it in the college's
  // IST timezone, not the learner browser's device timezone.
  if(!/^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}$/.test(date)){
   setError("Choose a valid future date and time in IST.");return;
  }
  const when=new Date(date+":00+05:30");
  const parts=new Intl.DateTimeFormat("en-US",{
   timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",
   hour:"2-digit",minute:"2-digit",hourCycle:"h23",
  }).formatToParts(when);
  const part=(key:string)=>parts.find(entry=>entry.type===key)?.value??"";
  const normalized=part("year")+"-"+part("month")+"-"+part("day")+"T"+
   part("hour")+":"+part("minute");
  if(!Number.isFinite(when.getTime())||normalized!==date||when.getTime()<=Date.now()){
   setError("Choose a valid future date and time in IST.");return;
  }
  setBusy(true);setError("");setSuccess("");
  try{
   await apiFetch("/api/placements/requests",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({requestType:"ROUND_RESCHEDULE",applicationId,roundId,
     reason:requestReason,scheduledAt:when.toISOString(),timezone:"Asia/Kolkata",mode:nextMode,
     venue:nextMode==="ON_CAMPUS"?nextVenue.trim()||null:null,
     meetingUrl:nextMode==="VIRTUAL"?nextUrl.trim()||null:null}),
   });
   setOpen(false);setSuccess("Reschedule request sent. Your booking is unchanged until approved.");
   showToast({tone:"success",title:"Sent. The placement cell will reply.",
    description:"Your current booking remains unchanged until approved."});router.refresh();
  }catch(e){
   const message=e instanceof FriendlyFetchError?e.message:
    e instanceof Error?e.message:"Could not send request.";
   setError(message);showToast({tone:"error",title:"Could not send",description:message});
  }
  finally{setBusy(false);}
 }
 return <div className="mt-3 space-y-2">
  <Button variant="link" type="button" aria-expanded={open} onClick={()=>setOpen(x=>!x)}
    className="max-md:min-h-11 font-semibold text-primary-text underline">{open?"Cancel":"Can't make it? Ask to reschedule"}</Button>
  {success?<p role="status" className="text-sm text-success">{success}</p>:null}
  {open?<div className="grid gap-3 rounded-[var(--lms-control-radius)] border border-border bg-surface-subtle p-3">
   <h4 className="font-semibold">Ask to reschedule</h4>
   <p className="text-sm text-body">The placement cell must approve your suggested time. You can add flexible times as notes, but the current approval process also needs an exact future date and a contact location or meeting link.</p>
   <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Reason (3–900 characters)
    <Textarea value={reason} onChange={e=>setReason(e.target.value)} minLength={3} maxLength={900} rows={3}
      className="mt-1 min-h-24 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface p-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-[rgba(38,186,199,0.15)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]"/></label>
   <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Times that work for you (optional)
    <Textarea rows={2} maxLength={350} value={preferredTimes} onChange={e=>setPreferredTimes(e.target.value)}
     className="mt-1 min-h-20 w-full" placeholder="e.g. weekday mornings, or after 3 PM"/>
   </label>
   <label className="text-sm">Preferred date and time
    <DateInput required mode="datetime-local" value={date} onChange={e=>setDate(e.target.value)}
      className="mt-1 min-h-11 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-[rgba(38,186,199,0.15)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9"/></label>
   <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Mode
    <Select value={nextMode} onChange={e=>setNextMode(e.target.value as typeof mode)}
      className="mt-1 min-h-11 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-[rgba(38,186,199,0.15)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
     <option value="ON_CAMPUS">On campus</option><option value="VIRTUAL">Online</option>
    </Select></label>
   {nextMode==="ON_CAMPUS"?<label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Suggested venue
    <Input required value={nextVenue} maxLength={500} onChange={e=>setNextVenue(e.target.value)}
      className="mt-1 min-h-11 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-[rgba(38,186,199,0.15)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9"/></label>:
    <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Suggested meeting URL
     <Input required type="url" value={nextUrl} maxLength={2000} onChange={e=>setNextUrl(e.target.value)}
      className="mt-1 min-h-11 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-[rgba(38,186,199,0.15)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9"/></label>}
   {requestReason.length>900?<p role="alert" className="text-xs text-error">Reason and preferred times must stay within 900 characters.</p>:null}
   {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
   <Button className="min-h-11 w-full sm:w-auto md:min-h-9" type="button" disabled={busy||reason.trim().length<3||requestReason.length>900||!date||
     (nextMode==="ON_CAMPUS"?!nextVenue.trim():!/^https:\/\//i.test(nextUrl))}
     onClick={()=>void save()} >
    {busy?"Sending…":"Send request"}</Button>
  </div>:null}
 </div>;
}

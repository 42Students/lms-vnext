"use client";
import { Button } from "@/components/ui/button";
import { Disclosure } from "@/components/ui/disclosure";
import { InlineNotice } from "@/components/ui/inline-notice";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {useRef,useState,type FormEvent} from "react";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {useRouter} from "next/navigation";
export function TpoInterviewRescheduleForm({round}:{
 round:{id:string;updatedAt:string;scheduledAt:string|null;mode:string|null;venue:string|null;meetingUrl:string|null}
}){
 const router=useRouter(),formRef=useRef<HTMLFormElement>(null);
 const [pending,setPending]=useState(false),[error,setError]=useState<string|null>(null);
 const [confirmOpen,setConfirmOpen]=useState(false);
 const [mode,setMode]=useState(round.mode??"ON_CAMPUS");
 const [venue,setVenue]=useState(round.venue??"");
 const [meetingUrl,setMeetingUrl]=useState(round.meetingUrl??"");
 const initial=round.scheduledAt?new Date(round.scheduledAt).toLocaleString("sv-SE",{timeZone:"Asia/Kolkata"}).replace(" ","T").slice(0,16):"";
 async function submitConfirmed(){
  if(pending||!formRef.current)return;
  const form=new FormData(formRef.current);
  setPending(true);setError(null);
  try{
   const response=await fetch("/api/placements/tpo/interviews/"+round.id+"/reschedule",{
    method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},
    body:JSON.stringify({confirmed:true,expectedUpdatedAt:round.updatedAt,
     localDateTime:String(form.get("localDateTime")??""),
     mode:String(form.get("mode")??"ON_CAMPUS"),
     venue:String(form.get("venue")??"").trim()||undefined,
     meetingUrl:String(form.get("meetingUrl")??"").trim()||undefined,
     reason:String(form.get("reason")??"").trim()}),
   });
   if(!response.ok){const body=await response.json().catch(()=>null) as {message?:string}|null;
    throw Error(body?.message??"Interview changed or venue was occupied; refresh before retrying.");}
   setConfirmOpen(false);
   router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Interview reschedule failed");}
  finally{setPending(false);}
 }
 const field="mt-1 min-h-11 w-full md:min-h-9";
 function askToReschedule(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(!pending)setConfirmOpen(true);
 }
 return <><Disclosure title="Confirm interview reschedule" className="min-w-0 border-y border-border py-2" contentClassName="pt-3"><form ref={formRef} onSubmit={askToReschedule} onChange={()=>setError(null)} className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
  <label className="min-w-0 text-sm text-body">New interview time (IST)
   <Input required type="datetime-local" name="localDateTime" defaultValue={initial} className={field}/></label>
  <label className="text-sm text-body">Mode
   <Select name="mode" value={mode} onChange={e=>setMode(e.target.value)} className={field}>
    <option value="ON_CAMPUS">On campus</option><option value="VIRTUAL">Virtual</option>
   </Select></label>
  {mode==="ON_CAMPUS"?<label className="min-w-0 text-sm text-body">Venue (for on-campus)
   <Input name="venue" value={venue} onChange={e=>setVenue(e.target.value)} className={field} maxLength={500}/></label>:null}
  {mode==="VIRTUAL"?<label className="min-w-0 text-sm text-body">Meeting URL (for virtual)
   <Input name="meetingUrl" type="url" value={meetingUrl} onChange={e=>setMeetingUrl(e.target.value)} className={field}/></label>:null}
  <label className="min-w-0 text-sm text-body sm:col-span-2">Reason (audited)
   <Textarea required name="reason" minLength={10} maxLength={1000} rows={2} className={field}/></label>
  {error?<div className="min-w-0 sm:col-span-2"><InlineNotice tone="error" message={error}/></div>:null}
  <Button variant="primary" type="submit" disabled={pending} className="min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] bg-primary px-4 font-[650] text-on-primary disabled:opacity-50 sm:col-span-2 sm:w-auto">
    {pending?"Rescheduling…":"Confirm interview reschedule"}</Button>
 </form></Disclosure><ConfirmDialog open={confirmOpen} onOpenChange={next=>{if(!pending)setConfirmOpen(next);}} pending={pending}
  title="Reschedule this interview?"
  description="Venue occupancy and version will be checked before saving, and the change is audited."
  confirmLabel="Confirm interview reschedule"
  confirmVariant="primary" onConfirm={()=>{void submitConfirmed();}}>
  {error?<InlineNotice tone="error" message={error}/>:null}
 </ConfirmDialog></>;
}

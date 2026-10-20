"use client";
import { Button } from "@/components/ui/button";
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
   router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Interview reschedule failed");}
  finally{setPending(false);}
 }
 const field="mt-1 min-h-11 md:min-h-9 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface p-2 text-foreground";
 function askToReschedule(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(!pending)setConfirmOpen(true);
 }
 return <><form ref={formRef} onSubmit={askToReschedule} className="mt-4 grid gap-3 border-t border-border pt-4 min-[768px]:grid-cols-2">
  <label className="text-sm text-body">New interview time (IST)
   <Input required type="datetime-local" name="localDateTime" defaultValue={initial} className={field}/></label>
  <label className="text-sm text-body">Mode
   <Select name="mode" defaultValue={round.mode??"ON_CAMPUS"} className={field}>
    <option value="ON_CAMPUS">On campus</option><option value="VIRTUAL">Virtual</option>
   </Select></label>
  <label className="text-sm text-body">Venue (for on-campus)
   <Input name="venue" defaultValue={round.venue??""} className={field} maxLength={500}/></label>
  <label className="text-sm text-body">Meeting URL (for virtual)
   <Input name="meetingUrl" type="url" defaultValue={round.meetingUrl??""} className={field}/></label>
  <label className="text-sm text-body min-[768px]:col-span-2">Reason (audited)
   <Textarea required name="reason" minLength={10} maxLength={1000} rows={2} className={field}/></label>
  {error?<div className="min-w-0 min-[768px]:col-span-2"><InlineNotice tone="error" message={error}/></div>:null}
  <Button variant="primary" type="submit" disabled={pending} className="min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] bg-primary px-4 font-[650] text-on-primary disabled:opacity-50 min-[768px]:col-span-2">
    {pending?"Rescheduling…":"Confirm interview reschedule"}</Button>
 </form><ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen} pending={pending}
  title="Reschedule this interview?"
  description="Venue occupancy and version will be checked before saving, and the change is audited."
  confirmLabel="Confirm interview reschedule"
  onConfirm={()=>{setConfirmOpen(false);void submitConfirmed();}}/></>;
}

"use client";
import {useRef,useState,type FormEvent} from "react";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {useRouter} from "next/navigation";
export function SuperAdminDriveDeadline({jobId,deadline}:{jobId:string;deadline:string|null}){
 const router=useRouter(),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const [pendingIso,setPendingIso]=useState<string|null>(null);
 const inFlightRef=useRef(false);
 const [saved,setSaved]=useState(false);
 function review(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(busy)return;
  const values=new FormData(event.currentTarget),date=String(values.get("deadline")??"");
  const iso=new Date(date+"+05:30");
  if(!Number.isFinite(iso.getTime())||iso.getTime()<=Date.now()){
   setError("Choose a future deadline.");return;
  }
  if(deadline&&iso.getTime()<=new Date(deadline).getTime()){
   setError("The new deadline must be later than the existing deadline.");return;
  }
  setPendingIso(iso.toISOString());setError("");setSaved(false);
 }
 async function save(){
  if(busy||inFlightRef.current||!pendingIso)return;
  inFlightRef.current=true;
  setBusy(true);setError("");
  try{
   const result=await fetch("/api/placements/college/jobs/"+encodeURIComponent(jobId)+"/extend-deadline",{
    method:"POST",headers:{"content-type":"application/json"},
    body:JSON.stringify({deadline:pendingIso,confirmed:true}),
   });
   if(!result.ok)throw new Error("Deadline extension failed.");
   setPendingIso(null);setSaved(true);router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Deadline extension failed.");}
  finally{inFlightRef.current=false;setBusy(false);}
 }
 return <section className="min-w-0 space-y-3"><form onSubmit={review} onChange={()=>{setError("");setSaved(false);}} className="grid min-w-0 gap-3 border-b border-border pb-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
  <h2 className="text-base font-semibold sm:col-span-2">Extend deadline</h2>
  <p className="text-sm text-body sm:col-span-2">Current deadline: {deadline?new Date(deadline).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})+" IST":"Not set"}</p>
  <label className="grid min-w-0 gap-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">New application deadline (IST)
   <Input name="deadline" type="datetime-local" required className="min-h-11 w-full md:min-h-9"/>
  </label>
  {error?<p role="alert" className="text-sm text-error sm:col-span-2">{error}</p>:null}
  <Button type="submit" className="min-h-11 w-full sm:w-auto md:min-h-9" disabled={busy}>
   {busy?"Saving…":"Extend deadline"}</Button>
 </form>
 {saved?<p role="status" className="text-sm text-body">Deadline extended.</p>:null}
 <ConfirmDialog open={pendingIso!==null} onOpenChange={next=>{if(!next&&!busy)setPendingIso(null);}}
  title="Extend the published application deadline? This affects when students can apply."
  confirmLabel="Extend deadline" confirmVariant="primary" pending={busy}
  onConfirm={()=>void save()}>
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
 </ConfirmDialog>
 </section>;
}

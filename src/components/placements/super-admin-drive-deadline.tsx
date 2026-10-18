"use client";
import {useRef,useState,type FormEvent} from "react";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {useRouter} from "next/navigation";
export function SuperAdminDriveDeadline({jobId,deadline}:{jobId:string;deadline:string|null}){
 const router=useRouter(),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const [pendingIso,setPendingIso]=useState<string|null>(null);
 const inFlightRef=useRef(false);
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
  setPendingIso(iso.toISOString());setError("");
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
   setPendingIso(null);router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Deadline extension failed.");}
  finally{inFlightRef.current=false;setBusy(false);}
 }
 return <div className="space-y-3"><form onSubmit={review} className="space-y-3 rounded-xl border border-border bg-surface p-4">
  <h2 className="text-base font-semibold">Extend deadline</h2>
  <p className="text-sm text-body">Current deadline: {deadline?new Date(deadline).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})+" IST":"Not set"}</p>
  <label className="grid max-w-md gap-1 text-sm font-semibold">New application deadline (IST)
   <input name="deadline" type="datetime-local" required className="min-h-11 rounded-md border border-border bg-background px-3 text-base sm:text-sm"/>
  </label>
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  <button type="submit" disabled={busy} className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-foreground disabled:opacity-50">
   {busy?"Saving…":"Extend deadline"}</button>
 </form>
 <ConfirmDialog open={pendingIso!==null} onOpenChange={next=>{if(!next&&!busy)setPendingIso(null);}}
  title="Extend the published application deadline? This affects when students can apply."
  confirmLabel="Extend deadline" confirmVariant="primary" pending={busy}
  onConfirm={()=>void save()}>
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
 </ConfirmDialog>
 </div>;
}

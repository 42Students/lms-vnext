"use client";
import {useRef,useState,type FormEvent} from "react";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {useRouter} from "next/navigation";
import {beginDriveMutation,endDriveMutation} from "@/modules/placements/drive-mutation-client-lock";
/** Legacy picker displays YYYY-MM-DD HH:mm in the college's IST timezone. */
function suggestedDeadlineInput(deadline:string|null){
 const original=deadline?Date.parse(deadline):NaN;
 const current=Date.now();
 // Legacy extends by seven days and suggests the END of that day in IST.
 const base=Number.isFinite(original)&&original>current?original:current;
 const local=new Date(base+7*86_400_000+330*60_000);
 return local.toISOString().slice(0,10)+"T23:59";
}
export function SuperAdminDriveDeadline({jobId,deadline}:{jobId:string;deadline:string|null}){
 const router=useRouter(),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const [pendingIso,setPendingIso]=useState<string|null>(null);
 const [savedIso,setSavedIso]=useState<string|null>(null);
 const inFlightRef=useRef(false);
 const [dateDraft,setDateDraft]=useState(()=>suggestedDeadlineInput(deadline));
 function review(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(busy)return;
  const date=dateDraft;
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
  if(!beginDriveMutation(jobId)){
   setError("Another action is changing this drive. Retry after it finishes.");return;
  }
  inFlightRef.current=true;
  setBusy(true);setError("");
  try{
   const result=await fetch("/api/placements/college/jobs/"+encodeURIComponent(jobId)+"/extend-deadline",{
    method:"POST",headers:{"content-type":"application/json"},
    body:JSON.stringify({deadline:pendingIso,confirmed:true}),
   });
   if(!result.ok)throw new Error("Could not extend the deadline");
   setSavedIso(pendingIso);setPendingIso(null);router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Could not extend the deadline");}
  finally{inFlightRef.current=false;setBusy(false);endDriveMutation(jobId);}
 }
 return <div className="space-y-3"><form onSubmit={review} aria-labelledby="super-admin-deadline-heading" className="min-w-0 space-y-[var(--lms-space-3)] border-b border-border pb-[var(--lms-space-4)]">
  <h2 id="super-admin-deadline-heading" className="text-base font-semibold">Extend deadline</h2>
  <p className="text-sm text-body">Current deadline: {deadline?new Date(deadline).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})+" IST":"Not set"}</p>
  <p className="max-w-2xl text-xs leading-5 text-muted-foreground">
    Choose a later date and time (YYYY-MM-DD HH:mm). If the previous deadline has passed,
    the picker suggests seven days from today. This action only extends the application deadline.
    Editing an unrelated drive field does not require extending an unchanged past deadline.
    Important Dates are managed separately and are not automatically shifted.
  </p>
  <label className="grid w-full max-w-md gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">New application deadline (IST)
   <Input name="deadline" type="datetime-local" required aria-invalid={Boolean(error)} aria-describedby={error?"super-admin-deadline-error":undefined} className="w-full" value={dateDraft}
     onChange={event=>{setDateDraft(event.target.value);setError("");setSavedIso(null);}}/>
  </label>
  {error?<p role="alert" id="super-admin-deadline-error" className="text-sm text-error">{error}</p>:null}
  {savedIso?<p role="status" className="text-sm text-success">Deadline extended to {new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",day:"numeric",month:"short",year:"numeric"}).format(new Date(savedIso))}</p>:null}
  <Button type="submit" className="min-h-11 w-full sm:w-auto md:min-h-9" disabled={busy}>
   {busy?"Saving…":"Extend deadline"}</Button>
 </form>
 <ConfirmDialog open={pendingIso!==null} onOpenChange={next=>{if(!next&&!busy)setPendingIso(null);}}
  title="Extend the published application deadline? This affects when students can apply."
  confirmLabel="Extend deadline" confirmVariant="primary" pending={busy}
  onConfirm={()=>void save()}>
  <p className="text-sm text-body">Current: {deadline?new Date(deadline).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})+" IST":"Not set"}</p>
  <p className="mt-2 text-sm text-body">New: {pendingIso?new Date(pendingIso).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})+" IST":"—"}</p>
  <p className="mt-2 text-xs text-muted-foreground">Important Dates will not move when you extend the application deadline.</p>
  {error?<p role="alert" id="super-admin-deadline-error" className="text-sm text-error">{error}</p>:null}
 </ConfirmDialog>
 </div>;
}

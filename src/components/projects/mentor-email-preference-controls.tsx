"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import type {MentorEmailPreferenceState} from
 "@/modules/projects/mentor-email-preference-model";

export function MentorEmailPreferenceControls(props:MentorEmailPreferenceState){
 const router=useRouter();
 const [enabled,setEnabled]=useState(props.enabled);
 const [saved,setSaved]=useState(props.enabled);
 const [version,setVersion]=useState(props.version);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState<string|null>(null);
 const [message,setMessage]=useState<string|null>(null);
 async function save(){
  if(busy||enabled===saved)return;
  setBusy(true);setError(null);setMessage(null);
  try{
   const res=await fetch("/api/mentor/preferences/email",{
    method:"POST",cache:"no-store",credentials:"same-origin",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({enabled,expectedVersion:version}),
   });
   if(!res.ok)throw new Error(res.status===409?
    "Preferences changed in another session. Refresh before saving again.":
    "Could not verify your saved email preference. Please retry.");
   const result=await res.json() as MentorEmailPreferenceState;
   setVersion(result.version);setEnabled(result.enabled);setSaved(result.enabled);
   setMessage("Your preference was saved. Email dispatch remains subject to provider verification.");
   router.refresh();
  }catch(caught){
   setError(caught instanceof Error?caught.message:"Unable to save your preference.");
  }finally{setBusy(false);}
 }
 return <section aria-label="Mentor email notification preferences"
   className="space-y-3 rounded-lg border border-border p-3">
   <h3 className="text-sm font-semibold">Project email notifications</h3>
   <label className="flex min-h-11 items-center gap-3 text-sm">
     <input type="checkbox" checked={enabled} disabled={busy}
       onChange={event=>{setEnabled(event.target.checked);setMessage(null);}}
       className="size-5"/>
     Allow emails for final submissions and meeting requests
   </label>
   <p className="text-xs text-muted-foreground">
     This is off until you opt in. Task reviews, blocked alerts,
     college announcements and routine updates remain in-app.
     Saving a preference does not guarantee external email delivery.
   </p>
   <Button type="button" size="sm" variant="secondary"
     disabled={busy||enabled===saved} loading={busy} onClick={()=>void save()}>
     Save email preference
   </Button>
   {message?<p role="status" className="text-sm">{message}</p>:null}
   {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
 </section>;
}

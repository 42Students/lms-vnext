"use client";
import { Checkbox } from "@/components/ui/checkbox";
import {useRouter} from "next/navigation";
import {useRef,useState} from "react";
import {Button} from "@/components/ui/button";
import {InlineNotice} from "@/components/ui/inline-notice";
type Preferences={notifyDriveOpenEmail:boolean;notifyResultApplied:boolean;notifyNudges:boolean;notifyPrepAssigned:boolean};
const fields=[
 ["notifyDriveOpenEmail","A drive opens or changes","Email to eligible students."],
 ["notifyResultApplied","Their result or status changed","In the daily summary email."],
 ["notifyNudges","Nudges from the placement cell","In the daily summary email."],
 ["notifyPrepAssigned","Prep assigned","In the daily summary email."],
] as const;
export function TpoOptionalEmailsEditor({initial,version}:{initial:Preferences;version:string|null}){
 const router=useRouter(),[value,setValue]=useState<Preferences>(initial);
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[status,setStatus]=useState("");
 const [saved,setSaved]=useState(initial),[currentVersion,setCurrentVersion]=useState(version);
 const inFlight=useRef(false);
 const dirty=fields.some(([key])=>value[key]!==saved[key]);
 async function save(){
  if(inFlight.current||!dirty)return;
  inFlight.current=true;
  setBusy(true);setError("");setStatus("");
  try{
   const response=await fetch("/api/placements/tpo/settings/communication",{
    method:"PATCH",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({section:"OPTIONAL_EMAILS",...value,expectedVersion:currentVersion}),
   });
   const result=await response.json().catch(()=>({})) as {error?:string;version?:string};
   if(!response.ok){
    // Never surface an arbitrary error field from a proxy or database provider.
    setError(response.status===401?"Your session expired. Sign in again.":
     response.status===403?"You no longer have permission to change these preferences.":
     response.status===409||result.error==="TPO_SETTINGS_STALE"?"Settings changed. Refresh before retrying.":
     response.status===503||result.error==="TPO_SETTINGS_PENDING"?"Email settings are temporarily unavailable. Try again.":
     "Email preferences were not saved. Please try again.");
    return;
   }
   setSaved({...value});
   setCurrentVersion(result.version??currentVersion);
   setStatus("Saved");router.refresh();
  }catch{
   setError("Email preferences could not be saved. Check the connection and try again.");
  }finally{
   inFlight.current=false;setBusy(false);
  }
 }
 return <section className="space-y-3 border-t border-border pt-5">
  <h2 className="font-semibold">Optional emails</h2>
  <p className="text-sm">Switch off what your students do not need. The in-app notice always shows; these control only the email.</p>
  {fields.map(([key,label,help])=><label key={key} className={"flex min-h-12 cursor-pointer items-center justify-between gap-4 rounded-[var(--lms-control-radius)] border-b border-border px-3 py-2 text-sm transition-colors duration-150 focus-within:outline-2 focus-within:outline-offset-[3px] focus-within:outline-[var(--lms-primary-text)] print:hidden "+(value[key]?"bg-primary-subtle":"hover:bg-surface-subtle")}>
   <span><span className="font-medium">{label}</span><span className="block text-xs text-muted-foreground">{help}</span></span>
   <Checkbox aria-label={label} checked={value[key]} disabled={busy}
    onChange={e=>setValue(current=>({...current,[key]:e.target.checked}))}/>
  </label>)}
  <ul aria-label="Current optional email preferences" className="hidden space-y-2 text-sm print:block">{fields.map(([key,label,help])=><li key={key} className="break-words border-b border-border pb-2"><strong>{label}:</strong> {value[key]?"On":"Off"} · {help}</li>)}</ul>
  <p className="text-xs text-muted-foreground">These are college preferences; sending requires verified mail templates and an enabled delivery provider.</p>
  <Button type="button" disabled={busy||!dirty} onClick={()=>void save()}
   className="min-h-11 md:min-h-9 print:hidden">Save changes</Button>
  {error?<InlineNotice tone="error" message={error}/>:null}
  {status?<InlineNotice tone="success" message={status}/>:null}
 </section>;
}

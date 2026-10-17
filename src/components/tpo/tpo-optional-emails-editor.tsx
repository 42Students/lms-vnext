"use client";
import {useRouter} from "next/navigation";
import {useState} from "react";
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
 const dirty=fields.some(([key])=>value[key]!==initial[key]);
 async function save(){
  if(busy||!dirty)return;
  setBusy(true);setError("");setStatus("");
  try{
   const response=await fetch("/api/placements/tpo/settings/communication",{
    method:"PATCH",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({section:"OPTIONAL_EMAILS",...value,expectedVersion:version}),
   });
   const result=await response.json() as {error?:string};
   if(!response.ok)throw Error(result.error==="TPO_SETTINGS_STALE"?"Settings changed. Refresh before retrying.":
    result.error??"Email preferences were not saved.");
   setStatus("Saved");router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Could not save settings.");}
  finally{setBusy(false);}
 }
 return <section className="space-y-3 rounded-xl border border-border bg-surface p-5">
  <h2 className="font-semibold">Optional emails</h2>
  <p className="text-sm">Switch off what your students do not need. The in-app notice always shows; these control only the email.</p>
  {fields.map(([key,label,help])=><label key={key} className="flex min-h-12 items-center justify-between gap-4 border-b border-border py-2 text-sm">
   <span><span className="font-medium">{label}</span><span className="block text-xs text-muted-foreground">{help}</span></span>
   <input type="checkbox" aria-label={label} checked={value[key]} disabled={busy}
    onChange={e=>setValue(current=>({...current,[key]:e.target.checked}))}/>
  </label>)}
  <p className="text-xs text-muted-foreground">These are college preferences; sending requires verified mail templates and an enabled delivery provider.</p>
  <button type="button" disabled={busy||!dirty} onClick={()=>void save()}
   className="min-h-11 rounded bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-50">Save changes</button>
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  {status?<p role="status" className="text-sm">{status}</p>:null}
 </section>;
}

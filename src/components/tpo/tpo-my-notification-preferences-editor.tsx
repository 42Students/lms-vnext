"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {TPO_NOTIFICATION_PREFERENCE_FIELDS,type TpoNotificationPreferences} from "@/modules/placements/tpo-my-notifications-model";
export function TpoMyNotificationPreferencesEditor({initial,version}:{initial:TpoNotificationPreferences;version:string|null}){
 const router=useRouter(),[value,setValue]=useState<TpoNotificationPreferences>(initial);
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[message,setMessage]=useState("");
 const dirty=TPO_NOTIFICATION_PREFERENCE_FIELDS.some(field=>value[field.key]!==initial[field.key]);
 async function save(){
  if((!dirty&&version!==null)||busy)return;
  setBusy(true);setError("");setMessage("");
  try{
   const response=await fetch("/api/placements/tpo/my-notification-preferences",{
    method:"PUT",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({...value,expectedVersion:version}),
   });
   const result=await response.json() as {error?:string};
   if(!response.ok)throw new Error(result.error==="STALE"?"Preferences changed elsewhere. Refresh and try again.":
    result.error==="NOT_READY"?"Preference storage is not available.":result.error??"Could not save preferences.");
   setMessage("Notification preferences saved");router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Could not save preferences.");}
  finally{setBusy(false);}
 }
 return <section aria-label="Edit my notification preferences" className="space-y-3 p-5">
  <p className="text-xs text-muted-foreground">These five preferences are for your own TPO account in this college. In-app history remains accessible. Delivery routing is controlled separately.</p>
  <div className="divide-y divide-border">
   {TPO_NOTIFICATION_PREFERENCE_FIELDS.map(field=><label key={field.key} className="flex min-h-14 items-center justify-between gap-4 py-3">
    <span><strong className="block text-sm">{field.label}</strong><span className="text-xs text-body">{field.description}</span></span>
    <input type="checkbox" aria-label={field.label} checked={value[field.key]} disabled={busy}
     onChange={e=>setValue(previous=>({...previous,[field.key]:e.target.checked}))}/>
   </label>)}
  </div>
  <button type="button" disabled={busy||(!dirty&&version!==null)} onClick={()=>void save()}
   className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-50">{busy?"Saving…":version===null&&!dirty?"Save default preferences":"Save preferences"}</button>
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  {message?<p role="status" className="text-sm text-body">{message}</p>:null}
 </section>;
}

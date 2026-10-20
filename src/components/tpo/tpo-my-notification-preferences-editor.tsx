"use client";
import { Checkbox } from "@/components/ui/checkbox";
import {useRef,useState} from "react";
import {Button} from "@/components/ui/button";
import {InlineNotice} from "@/components/ui/inline-notice";
import {useRouter} from "next/navigation";
import {TPO_NOTIFICATION_PREFERENCE_FIELDS,type TpoNotificationPreferences} from "@/modules/placements/tpo-my-notifications-model";
export function TpoMyNotificationPreferencesEditor({initial,version}:{initial:TpoNotificationPreferences;version:string|null}){
 const router=useRouter(),[value,setValue]=useState<TpoNotificationPreferences>(initial);
 const [saved,setSaved]=useState<TpoNotificationPreferences>(initial);
 const [currentVersion,setCurrentVersion]=useState(version);
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[message,setMessage]=useState("");
 const saving=useRef(false);
 const dirty=TPO_NOTIFICATION_PREFERENCE_FIELDS.some(field=>value[field.key]!==saved[field.key]);
 async function save(){
  if((!dirty&&currentVersion!==null)||saving.current)return;
  saving.current=true;setBusy(true);setError("");setMessage("");
  try{
   const response=await fetch("/api/placements/tpo/my-notification-preferences",{
    method:"PUT",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({...value,expectedVersion:currentVersion}),
   });
   const result=await response.json().catch(()=>null) as {error?:string;version?:string}|null;
   if(!response.ok)throw new Error(result?.error==="STALE"?"Preferences changed elsewhere. Refresh and try again.":
    result?.error==="NOT_READY"?"Preference storage is not available. Please try again later.":
    response.status===401?"Your session expired. Sign in again.":
    response.status===403?"You do not have permission to save these preferences.":
    "Could not save preferences. Try again.");
   // A lost response retry has the same values; the next changed request
   // must use the latest committed version and not the initial page token.
   if(typeof result?.version==="string")setCurrentVersion(result.version);
   setSaved({...value});
   setMessage("Notification preferences saved");router.refresh();
  }catch(e){setError(e instanceof Error && [
   "Preferences changed elsewhere. Refresh and try again.",
   "Preference storage is not available. Please try again later.",
   "Your session expired. Sign in again.",
   "You do not have permission to save these preferences.",
   "Could not save preferences. Try again.",
  ].includes(e.message)?e.message:"Could not save preferences. Try again.");}
  finally{saving.current=false;setBusy(false);}
 }
 return <section aria-label="Edit my notification preferences" className="space-y-3">
  <p className="text-xs text-muted-foreground">These five preferences are for your own TPO account in this college. In-app history remains accessible. Delivery routing is controlled separately.</p>
  <div className="divide-y divide-border">
   {TPO_NOTIFICATION_PREFERENCE_FIELDS.map(field=><label key={field.key} className={"flex min-h-14 cursor-pointer items-center justify-between gap-4 rounded-[var(--lms-control-radius-sm,8px)] px-3 py-3 transition-colors duration-150 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary "+(value[field.key]?"bg-primary-subtle":"hover:bg-surface-subtle")}>
    <span><strong className="block text-sm">{field.label}</strong><span className="text-xs text-body">{field.description}</span></span>
    <Checkbox aria-label={field.label} checked={value[field.key]} disabled={busy}
     onChange={e=>setValue(previous=>({...previous,[field.key]:e.target.checked}))}/>
   </label>)}
  </div>
  <Button type="button" disabled={busy||(!dirty&&currentVersion!==null)} onClick={()=>void save()}
   className="min-h-11 min-[768px]:min-h-9">{busy?"Saving…":currentVersion===null&&!dirty?"Save default preferences":"Save preferences"}</Button>
  {error?<InlineNotice tone="error" message={error}/>:null}
  {message?<InlineNotice tone="success" message={message}/>:null}
 </section>;
}

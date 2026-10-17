"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {LEGACY_TENANT_SETTING_MAP} from "@/modules/platform-settings/legacy-setting-specs";
type Entry={key:string;value:string;version:number};
export function OtherTenantSettings({scopeType,collegeId,ready,entries}:{
 scopeType:"GLOBAL"|"COLLEGE";collegeId?:string;ready:boolean;entries:readonly Entry[];
}){
 const router=useRouter();
 const [key,setKey]=useState(""),[value,setValue]=useState("");
 const [busy,setBusy]=useState(false),[message,setMessage]=useState("");
 const [pendingRemoval,setPendingRemoval]=useState<Entry|null>(null);
 const others=entries.filter(entry=>LEGACY_TENANT_SETTING_MAP.get(entry.key)?.scope!==scopeType);
 const target={scopeType,...(collegeId?{collegeId}:{})};
 async function apply(method:"POST"|"DELETE",entry?:Entry){
  if(busy||!ready)return;
  setBusy(true);setMessage("");
  try{
   const body=method==="POST"?{...target,key:key.trim(),value}:
    {...target,key:entry?.key,expectedVersion:entry?.version};
   const response=await fetch("/api/admin/settings/overrides",{
    method,credentials:"same-origin",headers:{"content-type":"application/json"},
    body:JSON.stringify(body),
   });
   if(!response.ok){
    setMessage(response.status===409
     ?"This setting changed. Reload the stored values before retrying."
     :"The setting could not be saved. Check the key and your scope.");
    return;
   }
   if(method==="POST"){setKey("");setValue("");}
   setMessage(method==="POST"?"Setting added. Stored keys do not automatically change any runtime service.":"Stored setting removed.");
   router.refresh();
  }catch{setMessage("Connection failed. The stored setting was not confirmed.");}
  finally{setBusy(false);setPendingRemoval(null);}
 }
 return <section aria-label="Other stored keys" className="space-y-3 rounded-lg border border-border p-4">
  <h3 className="font-semibold">Other stored keys</h3>
  <p className="text-sm text-body">These values are stored for reference. No runtime reader is activated by adding a key. Never enter passwords, credentials, tokens or secrets.</p>
  {others.length===0?<p className="text-sm text-body">No other stored keys at this scope.</p>:
   <ul className="space-y-2">
    {others.map(entry=>{
     const documented=LEGACY_TENANT_SETTING_MAP.get(entry.key);
     return <li key={entry.key} className="flex min-w-0 flex-wrap items-start justify-between gap-3 rounded-md border border-border p-3 text-sm">
      <div className="min-w-0 flex-1">
       <strong className="break-all">{entry.key}</strong>
       {documented?<p className="text-xs text-warning-text">Never read here — this key is read at {documented.scope} scope.</p>:null}
       <p className="mt-1 break-all text-body">{entry.value}</p>
      </div>
      <button type="button" disabled={!ready||busy} onClick={()=>setPendingRemoval(entry)}
       className="min-h-10 rounded-md border border-border px-3 font-semibold text-primary-text disabled:opacity-50">
       Remove</button>
     </li>;
    })}
   </ul>}
  <fieldset disabled={!ready||busy} className="space-y-2">
   <legend className="font-semibold">Add setting</legend>
   <label className="grid gap-1 text-sm">Key
    <input value={key} onChange={event=>setKey(event.target.value)} maxLength={120}
     placeholder="custom.settingName" autoComplete="off"
     className="min-h-11 rounded-md border border-border bg-background px-3"/>
   </label>
   <label className="grid gap-1 text-sm">Value
    <textarea rows={2} value={value} onChange={event=>setValue(event.target.value)}
     maxLength={4096} className="rounded-md border border-border bg-background p-3"/>
   </label>
   <p className="text-xs text-body">Use letters, digits, dots, dashes and underscores. Typos create unused keys. Documented settings must be edited in their section above.</p>
   <button type="button" disabled={!ready||busy||!/^[A-Za-z][A-Za-z0-9._-]*$/.test(key)||!value.trim()}
    onClick={()=>void apply("POST")} className="min-h-11 rounded-md bg-primary px-4 font-semibold text-on-primary disabled:opacity-50">
    {busy?"Saving…":"Add setting"}</button>
  </fieldset>
  {message?<p role="status" className="text-sm text-body">{message}</p>:null}
  <ConfirmDialog open={pendingRemoval!==null} onOpenChange={open=>{if(!open)setPendingRemoval(null);}}
   title={pendingRemoval?'Remove "'+pendingRemoval.key+'"?':"Remove setting?"}
   description="The stored value is deleted and the backend falls back to its built-in default. This does not remove a runtime configuration."
   confirmLabel="Remove setting" confirmVariant="danger" pending={busy}
   onConfirm={()=>{if(pendingRemoval)void apply("DELETE",pendingRemoval);}}/>
 </section>;
}

"use client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {LEGACY_TENANT_SETTING_MAP} from "@/modules/platform-settings/legacy-setting-specs";
type Entry={key:string;value:string;version:number};
export function OtherTenantSettings({scopeType,collegeId,ready,entries}:{
 scopeType:"GLOBAL"|"COLLEGE";collegeId?:string;ready:boolean;entries:readonly Entry[];
}){
 const router=useRouter();
 const inFlightRef=useRef(false);
 const validKey=/^[A-Za-z][A-Za-z0-9._-]*$/;
 const [key,setKey]=useState(""),[value,setValue]=useState("");
 const [busy,setBusy]=useState(false),[message,setMessage]=useState("");
 const [messageTone,setMessageTone]=useState<"success"|"error">("success");
 const [pendingRemoval,setPendingRemoval]=useState<Entry|null>(null);
 const others=entries.filter(entry=>LEGACY_TENANT_SETTING_MAP.get(entry.key)?.scope!==scopeType);
 const target={scopeType,...(collegeId?{collegeId}:{})};
 async function apply(method:"POST"|"DELETE",entry?:Entry){
  if(busy||inFlightRef.current||!ready)return;
  inFlightRef.current=true;
  setBusy(true);setMessage("");
  try{
   const body=method==="POST"?{...target,key:key.trim(),value}:
    {...target,key:entry?.key,expectedVersion:entry?.version};
   const response=await fetch("/api/admin/settings/overrides",{
    method,credentials:"same-origin",headers:{"content-type":"application/json"},
    body:JSON.stringify(body),
   });
   if(!response.ok){
    setMessageTone("error");
    setMessage(response.status===409
     ?"This setting changed. Reload the stored values before retrying."
     :"The setting could not be saved. Check the key and your scope.");
    return;
   }
   if(method==="POST"){setKey("");setValue("");}
   if(method==="DELETE")setPendingRemoval(null);
   setMessageTone("success");
   setMessage(method==="POST"?"Setting added. Stored keys do not automatically change any runtime service.":"Stored setting removed.");
   router.refresh();
  }catch{setMessageTone("error");setMessage("Connection failed. The stored setting was not confirmed.");}
  finally{inFlightRef.current=false;setBusy(false);}
 }
 return <section aria-label="Other stored keys" className="min-w-0 space-y-[var(--lms-space-3)] border-b border-border pb-[var(--lms-space-4)] print:hidden">
  <h3 className="font-semibold">Other stored keys</h3>
  <p className="max-w-prose text-sm leading-6 text-body">These values are stored for reference. No runtime reader is activated by adding a key. Never enter passwords, credentials, tokens or secrets.</p>
  {!ready?<Alert tone="warning">Stored setting changes are unavailable in this scope.</Alert>:null}
  {others.length===0?<p className="text-sm text-body">No other stored keys at this scope.</p>:
   <ul className="min-w-0 space-y-[var(--lms-space-2)]">
    {others.map(entry=>{
     const documented=LEGACY_TENANT_SETTING_MAP.get(entry.key);
     return <li key={entry.key} className="flex min-w-0 flex-col items-stretch gap-[var(--lms-space-3)] border-b border-border py-[var(--lms-space-3)] text-sm transition-colors duration-200 hover:bg-surface-subtle focus-within:outline-2 focus-within:outline-offset-[3px] focus-within:outline-[var(--lms-primary-text)] sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
       <strong className="break-all">{entry.key}</strong>
       {documented?<p className="text-xs text-warning-text">Never read here — this key is read at {documented.scope} scope.</p>:null}
       <p className="mt-1 break-all text-body">{entry.value==="[redacted]"?"[redacted]":entry.value}</p>
      </div>
      <Button variant="danger" type="button" disabled={!ready||busy} onClick={()=>{setMessage("");setPendingRemoval(entry);}}
       className="min-h-11 w-full sm:w-auto md:min-h-9">
       Remove</Button>
     </li>;
    })}
   </ul>}
  <fieldset disabled={!ready||busy} className="space-y-2">
   <legend className="font-semibold text-foreground">Add setting</legend>
   <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold text-[var(--lms-neutral-400)] leading-4">Key
    <Input value={key} aria-invalid={Boolean(key&&!validKey.test(key))} aria-describedby="other-keys-syntax" onChange={event=>{setKey(event.target.value);setMessage("");}} maxLength={120}
     placeholder="custom.settingName" autoComplete="off"
     className="min-h-11 md:min-h-9 w-full"/>
   </label>
   <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold text-[var(--lms-neutral-400)] leading-4">Value
    <Textarea rows={2} value={value} onChange={event=>{setValue(event.target.value);setMessage("");}}
     maxLength={4096} className="min-h-24 w-full"/>
   </label>
   <p id="other-keys-syntax" className="max-w-prose text-xs leading-5 text-body">Use letters, digits, dots, dashes and underscores. Typos create unused keys. Documented settings must be edited in their section above.</p>
   {key&&!validKey.test(key)?<p role="alert" className="text-xs text-error">Enter a valid setting key.</p>:null}
   <Button variant="primary" type="button" loading={busy} disabled={!ready||busy||!validKey.test(key)||!value.trim()}
    onClick={()=>void apply("POST")} className="min-h-11 w-full sm:w-auto md:min-h-9">
    {busy?"Saving…":"Add setting"}</Button>
  </fieldset>
  {message?<Alert tone={messageTone}>{message}</Alert>:null}
  <ConfirmDialog open={pendingRemoval!==null} onOpenChange={open=>{if(!open)setPendingRemoval(null);}}
   title={pendingRemoval?'Remove "'+pendingRemoval.key+'"?':"Remove setting?"}
   description="The stored value is deleted and the backend falls back to its built-in default. This does not remove a runtime configuration."
   confirmLabel="Remove setting" confirmVariant="danger" pending={busy} confirmDisabled={!ready||!pendingRemoval}
   onConfirm={()=>{if(pendingRemoval)void apply("DELETE",pendingRemoval);}}>
    {message&&messageTone==="error"?<Alert tone="error">{message}</Alert>:null}
   </ConfirmDialog>
 </section>;
}

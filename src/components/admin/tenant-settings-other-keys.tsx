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
export function OtherTenantSettings({scopeType,collegeId,ready,entries,showHeading=true}:{
 scopeType:"GLOBAL"|"COLLEGE";collegeId?:string;ready:boolean;entries:readonly Entry[];showHeading?:boolean;
}){
 const router=useRouter();
 const inFlightRef=useRef(false);
 const validKey=/^[A-Za-z][A-Za-z0-9._-]*$/; // Deliberately matches the current protected server contract.
 const [key,setKey]=useState(""),[value,setValue]=useState("");
 const [busy,setBusy]=useState(false),[message,setMessage]=useState("");
 const [messageTone,setMessageTone]=useState<"success"|"error">("success");
 const [pendingRemoval,setPendingRemoval]=useState<Entry|null>(null);
 const others=entries.filter(entry=>LEGACY_TENANT_SETTING_MAP.get(entry.key)?.scope!==scopeType);
 const target={scopeType,...(collegeId?{collegeId}:{})};
 const documentedSpec=LEGACY_TENANT_SETTING_MAP.get(key.trim());
 const documentedKey=Boolean(documentedSpec);
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
    const failure=await response.json().catch(()=>null);
    setMessageTone("error");
    const detail=failure?.error;
    setMessage(detail==="SETTING_STALE"||response.status===409
      ? method==="POST"
        ? "A stored setting with this key already exists at this scope. Choose another key."
        : "This setting changed. Reload its stored value before retrying."
      : detail==="SETTING_SCOPE_DENIED"||response.status===403
        ? "This setting scope is unavailable for your current college or role."
        : detail==="INVALID_SETTING"
          ? "This key is restricted or documented. Use a non-secret custom key in the correct scope."
          : response.status===400
            ? "Check the key format, value and selected scope before saving."
            : "The setting could not be saved. Check the key and your scope.");
    return;
   }
   const changedKey=method==="POST"?key.trim():entry?.key??"";
   if(method==="POST"){setKey("");setValue("");}
   if(method==="DELETE")setPendingRemoval(null);
   setMessageTone("success");
   setMessage(method==="POST"
     ? 'Added "'+changedKey+'". Stored keys do not automatically change any runtime service.'
     : 'Removed "'+changedKey+'". The stored-only value has been deleted.');
   router.refresh();
  }catch{setMessageTone("error");setMessage("Connection failed. The stored setting was not confirmed.");}
  finally{inFlightRef.current=false;setBusy(false);}
 }
 return <section aria-label="Other stored keys" className="min-w-0 space-y-[var(--lms-space-3)] border-b border-border pb-[var(--lms-space-4)] print:hidden">
  {showHeading?<h3 className="font-semibold">Other stored keys</h3>:null}
  <p className="max-w-prose text-sm leading-[22px] text-body">These values are stored for reference. No runtime reader is activated by adding a key. Never enter passwords, credentials, tokens or secrets.</p>
  {!ready?<Alert tone="warning">Stored setting changes are unavailable in this scope.</Alert>:null}
  {others.length===0?<p className="text-sm text-body leading-[22px]">No other stored keys at this scope.</p>:
   <ul className="min-w-0 space-y-[var(--lms-space-2)]">
    {others.map(entry=>{
     const documented=LEGACY_TENANT_SETTING_MAP.get(entry.key);
     return <li key={entry.key} className="flex min-w-0 flex-col items-stretch gap-[var(--lms-space-3)] border-b border-border py-[var(--lms-space-3)] text-sm transition-colors duration-200 hover:bg-surface-subtle focus-within:outline-2 focus-within:outline-offset-[3px] focus-within:outline-[var(--lms-primary-text)] sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
       <strong className="break-all">{entry.key}</strong>
       {documented?<p className="text-xs text-warning-text leading-5">Never read here — this key is read at {documented.scope} scope.</p>:null}
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
   <label className="grid gap-2 text-[13px] font-semibold text-[var(--lms-neutral-400)] leading-4">Key
    <Input value={key} aria-invalid={Boolean(key&&!validKey.test(key))} aria-describedby="other-keys-syntax" onChange={event=>{setKey(event.target.value);setMessage("");}} maxLength={120}
     placeholder="custom.settingName" autoComplete="off"
     className="min-h-11 md:min-h-9 w-full"/>
   </label>
   <label className="grid gap-2 text-[13px] font-semibold text-[var(--lms-neutral-400)] leading-4">Value
    <Textarea rows={2} value={value} onChange={event=>{setValue(event.target.value);setMessage("");}}
     maxLength={4096} className="min-h-24 w-full"/>
   </label>
   <p id="other-keys-syntax" className="max-w-prose text-xs leading-5 text-body">Start with a letter; then use letters, digits, dots, dashes or underscores. Custom keys are stored only and do not change runtime behavior. Typos create unused keys.</p>
   {key&&!validKey.test(key)?<p role="alert" className="text-xs text-error leading-5">Start with a letter, then use only letters, digits, dots, dashes or underscores.</p>:null}
   {documentedSpec?<p role="status" className="text-xs text-warning-text leading-5">This key is documented for {documentedSpec.scope==="GLOBAL"?"Global":"College"} scope. Switch to that scope if needed, then use its dedicated settings section instead of adding a stored-only key.</p>:null}
   <Button variant="primary" type="button" loading={busy} disabled={!ready||busy||!validKey.test(key)||documentedKey||!value.trim()}
    onClick={()=>void apply("POST")} className="min-h-11 w-full sm:w-auto md:min-h-9">
    {busy?"Saving…":"Add setting"}</Button>
  </fieldset>
  {message&&!(pendingRemoval&&messageTone==="error")?<Alert tone={messageTone}>{message}</Alert>:null}
  <ConfirmDialog open={pendingRemoval!==null} onOpenChange={open=>{if(!open)setPendingRemoval(null);}}
   title={pendingRemoval?'Remove "'+pendingRemoval.key+'"?':"Remove setting?"}
   description="This removes the stored-only value. It does not change any live service or remove a documented operational setting."
   confirmLabel="Remove setting" confirmVariant="danger" pending={busy} confirmDisabled={!ready||!pendingRemoval}
   onConfirm={()=>{if(pendingRemoval)void apply("DELETE",pendingRemoval);}}>
    {message&&messageTone==="error"?<Alert tone="error">{message}</Alert>:null}
   </ConfirmDialog>
 </section>;
}

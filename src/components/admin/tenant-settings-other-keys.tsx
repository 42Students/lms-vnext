"use client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LEGACY_TENANT_SETTING_MAP } from "@/modules/platform-settings/legacy-setting-specs";

type Entry = {key:string;value:string;version:number};
const KEY_PATTERN = /^[A-Za-z][A-Za-z0-9._-]*$/;
const PAGE_SIZE = 200;

export function OtherTenantSettings({scopeType,collegeId,ready,entries,showHeading=true}:{
 scopeType:"GLOBAL"|"COLLEGE";collegeId?:string;ready:boolean;entries:readonly Entry[];showHeading?:boolean;
}){
 const router=useRouter();
 const inFlightRef=useRef(false);
 const addTriggerRef=useRef<HTMLButtonElement|null>(null);
 const [key,setKey]=useState(""),[value,setValue]=useState("");
 const [addOpen,setAddOpen]=useState(false),[confirmDiscard,setConfirmDiscard]=useState(false);
 const [visibleCount,setVisibleCount]=useState(PAGE_SIZE);
 const [busy,setBusy]=useState(false),[message,setMessage]=useState("");
 const [messageTone,setMessageTone]=useState<"success"|"error">("success");
 const [pendingRemoval,setPendingRemoval]=useState<Entry|null>(null);
 const others=entries.filter(entry=>LEGACY_TENANT_SETTING_MAP.get(entry.key)?.scope!==scopeType)
  .sort((a,b)=>a.key.localeCompare(b.key,"en"));
 const target={scopeType,...(collegeId?{collegeId}:{})};
 const documentedSpec=LEGACY_TENANT_SETTING_MAP.get(key.trim());
 const invalidKey=key.length>0&&!KEY_PATTERN.test(key);
 const validAdd=KEY_PATTERN.test(key)&&!documentedSpec&&value.trim().length>0;
 function clearDraft(){setKey("");setValue("");}
 function closeAdd(){
  if(busy||confirmDiscard)return;
  if(key!==""||value!==""){setConfirmDiscard(true);return;}
  setAddOpen(false);
 }
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
   if(method==="POST"){clearDraft();setAddOpen(false);}
   if(method==="DELETE")setPendingRemoval(null);
   setMessageTone("success");
   setMessage(method==="POST"
     ? 'Added "'+changedKey+'". Stored keys do not automatically change any runtime service.'
     : 'Removed "'+changedKey+'".');
   router.refresh();
  }catch{setMessageTone("error");setMessage("Connection failed. The stored setting was not confirmed.");}
  finally{inFlightRef.current=false;setBusy(false);}
 }
 return <section aria-label="Other stored keys" className="min-w-0 space-y-[var(--lms-space-3)] border-b border-border pb-[var(--lms-space-4)] print:hidden">
  <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
   <div className="min-w-0">
    {showHeading?<h3 className="font-semibold">Other stored keys</h3>:null}
    <p className="text-xs text-body">{others.length} key(s)</p>
   </div>
   <Button ref={addTriggerRef} variant="secondary" type="button" disabled={!ready||busy}
    onClick={()=>{setMessage("");setAddOpen(true);}} className="min-h-11 md:min-h-9">
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
    Add setting
   </Button>
  </div>
  <p className="max-w-prose text-sm leading-[22px] text-body">Keys stored at this scope that are not in the documented list above — a new backend setting this screen does not name yet, or a value left at a scope that never reads it. Never enter passwords, credentials, tokens or secrets.</p>
  {!ready?<Alert tone="warning">Stored setting changes are unavailable in this scope.</Alert>:null}
  <div className="min-w-0 overflow-x-auto" role="region" aria-label="Other stored settings table" tabIndex={0}>
   <table className="w-full min-w-[600px] border-collapse text-left text-sm">
    <thead><tr className="border-b border-border bg-surface-subtle">
     <th scope="col" className="w-[300px] px-3 py-2 font-semibold">Key</th>
     <th scope="col" className="px-3 py-2 font-semibold">Value</th>
     <th scope="col" className="w-[60px] px-3 py-2 font-semibold"><span className="sr-only">Actions</span></th>
    </tr></thead>
    <tbody>
     {others.length===0?<tr><td colSpan={3} className="px-3 py-6 text-center text-body">No other keys stored at this scope.</td></tr>:
      others.slice(0,visibleCount).map(entry=>{
       const documented=LEGACY_TENANT_SETTING_MAP.get(entry.key);
       return <tr key={entry.key} className="border-b border-border align-top hover:bg-surface-subtle">
        <td className="max-w-[300px] break-all px-3 py-2 font-mono text-xs">
         <code>{entry.key}</code>
         {documented?<p className="mt-1 font-sans text-xs text-warning-text">Never read here — this key is read at {documented.scope} scope.</p>:null}
        </td>
        <td className="break-all px-3 py-2 text-body">{entry.value}</td>
        <td className="px-3 py-2 text-right">
         <Button variant="ghost" type="button" disabled={!ready||busy} title="Remove this setting"
          aria-label={"Remove setting "+entry.key} className="min-h-9 min-w-9 p-2 text-error"
          onClick={()=>{setMessage("");setPendingRemoval(entry);}}>
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 10v7m4-7v7"/></svg>
         </Button>
        </td>
       </tr>;
      })}
    </tbody>
   </table>
  </div>
  {others.length>visibleCount?<div className="flex flex-wrap items-center justify-between gap-2 text-xs text-body">
   <span>Showing {Math.min(visibleCount,others.length)} of {others.length} keys</span>
   <Button type="button" variant="secondary" onClick={()=>setVisibleCount(count=>count+PAGE_SIZE)}>Show next {Math.min(PAGE_SIZE,others.length-visibleCount)} keys</Button>
  </div>:null}
  {message&&!addOpen&&!pendingRemoval?<Alert tone={messageTone}>{message}</Alert>:null}
  <Dialog open={addOpen} onOpenChange={open=>{if(!open)closeAdd();}} title="Add a setting"
   footer={<>
    <Button type="button" variant="secondary" disabled={busy} onClick={closeAdd}>Cancel</Button>
    <Button type="button" variant="primary" loading={busy} disabled={!ready||busy||!validAdd}
     onClick={()=>void apply("POST")}>{busy?"Saving…":"Add"}</Button>
   </>}>
   <div className="space-y-4">
    <Alert tone="warning">
     <strong>Keys are matched exactly, and only at the scope that reads them</strong>
     <p className="mt-1">A typo creates a new unused key rather than an error — the backend keeps using its default. Copy the key from the code that reads it, and make sure you are on the right scope.</p>
    </Alert>
    <label className="grid gap-2 text-sm font-semibold">Key
     <Input value={key} autoFocus maxLength={120} autoComplete="off"
      placeholder="e.g. course.watchedThresholdPercent"
      aria-invalid={invalidKey} aria-describedby="other-key-help"
      onChange={event=>{setKey(event.target.value);setMessage("");}}/>
    </label>
    <p id="other-key-help" className="text-xs text-body">Letters, digits, dot, dash and underscore only. The current protected API additionally requires the key to start with a letter; do not use secrets.</p>
    {invalidKey?<p role="alert" className="text-xs text-error">Start with a letter; use letters, digits, dots, dashes or underscores only.</p>:null}
    {documentedSpec?<p role="status" className="text-xs text-warning-text">
     {documentedSpec.scope!==scopeType
      ? "That key is read at "+documentedSpec.scope+" scope — storing it here has no effect."
      : "This key belongs to the documented settings above; edit it there instead."}
    </p>:null}
    <label className="grid gap-2 text-sm font-semibold">Value
     <Textarea rows={2} value={value} maxLength={4096} placeholder="Value"
      onChange={event=>{setValue(event.target.value);setMessage("");}}/>
    </label>
    <p className="text-xs text-body">The legacy form allowed blank values; the protected stored-only API currently requires a non-empty value. Blank restores defaults for documented settings.</p>
    {message&&messageTone==="error"?<Alert tone="error">{message}</Alert>:null}
   </div>
  </Dialog>
  <ConfirmDialog open={confirmDiscard} onOpenChange={open=>{if(!open)setConfirmDiscard(false);}}
   title="Discard this new setting?" description="The key and value you entered will be lost."
   confirmLabel="Discard" confirmVariant="danger" cancelLabel="Keep editing"
   onConfirm={()=>{setConfirmDiscard(false);setAddOpen(false);clearDraft();}}/>
  <ConfirmDialog open={pendingRemoval!==null} onOpenChange={open=>{if(!open)setPendingRemoval(null);}}
   title={pendingRemoval?'Remove "'+pendingRemoval.key+'"?':"Remove setting?"}
   description="The stored value is deleted and the backend falls back to its built-in default."
   confirmLabel="Remove" confirmVariant="danger" pending={busy} confirmDisabled={!ready||!pendingRemoval}
   onConfirm={()=>{if(pendingRemoval)void apply("DELETE",pendingRemoval);}}>
    {message&&messageTone==="error"?<Alert tone="error">{message}</Alert>:null}
  </ConfirmDialog>
 </section>;
}

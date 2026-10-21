"use client";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Alert } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Disclosure} from "@/components/ui/disclosure";
import {OtherTenantSettings} from "@/components/admin/tenant-settings-other-keys";
import {LEGACY_TENANT_SETTING_SPECS,type LegacyTenantSettingSpec} from "@/modules/platform-settings/legacy-setting-specs";
import {useToast} from "@/components/ui/toast";
type Entry={key:string;value:string;version:number};
type Result={key:string;status:"SAVED"|"DELETED"|"FAILED";message:string;version?:number};
function validateValue(spec:LegacyTenantSettingSpec,raw:string):string|null{
 const value=raw.trim();
 // Empty is intentionally allowed: it deletes this override and restores
 // the source default. Do not invent a mandatory value for optional keys.
 if(!value)return null;
 if(value.length>4096)return "Must be 4,096 characters or fewer.";
 if(spec.type==="int"||spec.type==="decimal"){
  const number=Number(value);
  if(!Number.isFinite(number)||(spec.type==="int"&&!Number.isSafeInteger(number)))
   return spec.type==="int"?"Must be a whole number.":"Must be a valid number.";
  if("min" in spec&&typeof spec.min==="number"&&
     "max" in spec&&typeof spec.max==="number"&&
     (number<spec.min||number>spec.max))
   return "Must be between "+spec.min+" and "+spec.max+".";
  return null;
 }
 if(spec.key==="cookieSameSite"&&!["Strict","Lax","None"].includes(value))
  return "Choose Strict, Lax or None.";
 if(["baseDomain","globalHost","cookieDomain"].includes(spec.key)){
  const host=value.replace(/^\./,"");
  if(!/^[a-z0-9](?:[a-z0-9-]*\.)+[a-z]{2,}$/i.test(host)||host.length>253)
   return "Enter a valid DNS hostname.";
 }
 return null;
}
function runtimeHint(spec:LegacyTenantSettingSpec):string{
 if(spec.key.startsWith("sms.")){
  return "Exotel sender/provider setup and India's registered DLT template must match the approved text and variable order exactly. Use approved {#var#} placeholders or the registered provider mapping; do not paste credentials here. A stored override is not proof of SMS delivery.";
 }
 if(spec.key.startsWith("otp.")){
  return "OTP attempt/window overrides are stored policy, not evidence that login throttling consumers have switched to these values. Confirm active limiter configuration before relying on this change.";
 }
 if(spec.dangerous){
  return "Requires an owner-approved deployment or runtime consumer cutover. Saving this value does not instantly modify live DNS, cookies, identity, or messaging.";
 }
 return "Blank restores the source default. Saving an override is distinct from verifying which operational reader is using it.";
}

export function TenantSettingsEditor({scopeType,collegeId,ready,entries}:{
 scopeType:"GLOBAL"|"COLLEGE";collegeId?:string;ready:boolean;entries:readonly Entry[];
}){
 const router=useRouter();
 const {showToast}=useToast();
 const sectionRef=useRef<HTMLElement|null>(null);
 const bypassUnload=useRef(false);
 const [leaveHref,setLeaveHref]=useState<string|null>(null);
 const [otherDirty,setOtherDirty]=useState(false);
 // Saving an unlisted key refreshes the authoritative entries list.
 // Retire its conservative pending-draft warning on that verified refresh.
 useEffect(()=>{setOtherDirty(false);},[entries]);
 const keys=LEGACY_TENANT_SETTING_SPECS.filter(item=>item.scope===scopeType);
 const existing=new Map(entries.map(row=>[row.key,row]));
 const [draft,setDraft]=useState<Record<string,string>>(()=>Object.fromEntries(
  keys.map(spec=>[spec.key,existing.get(spec.key)?.value??""])));
 const inFlight=useRef(false);
 const [saving,setSaving]=useState(false),[results,setResults]=useState<Result[]>([]),
  [error,setError]=useState("");
 const changed=keys.filter(item=>draft[item.key]!== (existing.get(item.key)?.value??""));
 const impact=changed.some(item=>item.dangerous);
 const dirty=changed.length>0||otherDirty;
 const invalid=changed.flatMap(spec=>{
  const message=validateValue(spec,draft[spec.key]??"");
  return message?[{key:spec.key,message}]:[];
 });
 const invalidKeys=new Map(invalid.map(item=>[item.key,item.message]));
 useEffect(()=>{
  if(!dirty)return;
  const beforeUnload=(event:BeforeUnloadEvent)=>{
   if(bypassUnload.current)return;
   event.preventDefault();event.returnValue="";
  };
  const guardLink=(event:MouseEvent)=>{
   if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
   const target=event.target;
   if(!(target instanceof Element))return;
   const anchor=target.closest("a[href]");
   if(!(anchor instanceof HTMLAnchorElement)||anchor.target==="_blank"||anchor.hasAttribute("download"))return;
   const link=new URL(anchor.href,window.location.href);
   if(link.origin!==window.location.origin||
     (link.pathname===window.location.pathname&&link.search===window.location.search))return;
   event.preventDefault();event.stopPropagation();
   setLeaveHref(link.pathname+link.search+link.hash);
  };
  document.addEventListener("click",guardLink,true);
  window.addEventListener("beforeunload",beforeUnload);
  return ()=>{
   document.removeEventListener("click",guardLink,true);
   window.removeEventListener("beforeunload",beforeUnload);
  };
 },[dirty]);
 const [impactConfirm,setImpactConfirm]=useState(false);
 async function save(confirmedHighImpact=false){
  if(!ready||saving||inFlight.current)return;
  if(changed.length===0){showToast({tone:"info",title:"No changes to save."});return;}
  if(invalid.length){setError("Fix the highlighted values before saving.");return;}
  if(impact&&!confirmedHighImpact){setImpactConfirm(true);return;}
  setImpactConfirm(false);
  inFlight.current=true;
  setSaving(true);setResults([]);setError("");
  try{
   const response=await fetch("/api/admin/settings/overrides",{method:"PATCH",credentials:"same-origin",
    headers:{"content-type":"application/json"},
    body:JSON.stringify({scopeType,...(collegeId?{collegeId}:{}),confirmedHighImpact:impact,
     changes:changed.map(spec=>({key:spec.key,value:draft[spec.key],expectedVersion:existing.get(spec.key)?.version??0}))}),
   });
   if(!response.ok){
    const body=await response.json().catch(()=>({error:"FAILED"})) as {error?:string};
    throw Error(body.error==="SETTINGS_STORAGE_PENDING"?"Tenant settings migration is not registered.":"Could not save settings.");
   }
   const data:unknown=await response.json().catch(()=>null);
   const receipt=data&&typeof data==="object"&&!Array.isArray(data)
     ?data as {results?:unknown;saved?:unknown;failed?:unknown}:null;
   if(!receipt||!Array.isArray(receipt.results)||
      receipt.results.length!==changed.length||
      !receipt.results.every(row=>row&&typeof row==="object"&&
        typeof row.key==="string"&&changed.some(spec=>spec.key===row.key)&&
        ["SAVED","DELETED","FAILED"].includes(row.status)&&typeof row.message==="string")||
      typeof receipt.saved!=="number"||typeof receipt.failed!=="number"||
      receipt.saved+receipt.failed!==changed.length)
     throw Error("Settings response could not be verified. Refresh before retrying.");
   const savedCount=receipt.saved;
   const failedCount=receipt.failed;
   setResults(receipt.results as Result[]);
   if(savedCount>0)showToast({tone:failedCount>0?"warning":"success",
    title:"Saved "+savedCount+" setting(s).",
    description:failedCount>0?"Not saved: "+failedCount+" setting(s). Review the errors and refresh before retrying.":"Stored overrides saved; live activation depends on the consumer and deployment."});
   if(failedCount>0)setError("Saved "+savedCount+" setting(s). Not saved: "+failedCount+" setting(s). Refresh stored versions before retrying failed keys.");
   router.refresh();
  }catch(cause){setError(cause instanceof Error?cause.message:"Save failed");}
  finally{inFlight.current=false;setSaving(false);}
 }
 const groups=[...new Set(keys.map(spec=>spec.group))];
 return <section ref={sectionRef} aria-label="Edit Tenant Settings" className="min-w-0 space-y-4 border-b border-border pb-4 print:hidden">
  <h2 className="text-lg font-semibold text-[var(--lms-heading)]">Edit Tenant Settings</h2>
  <p className="max-w-prose text-sm leading-[22px] text-body">Scope: {scopeType==="GLOBAL"?"Global":"Selected college"}. Blank values restore the source default.
   Each field has its legacy validation range. Platform security overrides require a separate rollout before taking effect.</p>
  {!ready?<Alert tone="warning">The tenant-settings migration is pending. This form is read-only.</Alert>:null}
  {dirty?<Alert tone="warning" role="status">
   You have unsaved changes. Switching the college or scope, navigating to another page, or reloading may discard the draft. Save settings or confirm leaving without saving.
  </Alert>:null}
  {groups.map((group,index)=><Disclosure key={group} title={<span className="flex min-w-0 flex-wrap items-center gap-2">
    <span className="text-sm font-semibold">{group}</span>
    {changed.some(item=>item.group===group)?<span className="text-xs font-normal text-muted-foreground">{changed.filter(item=>item.group===group).length} changed</span>:null}
   </span>} defaultOpen={index===0} className="border-t border-border" contentClassName="px-2 pb-3">
   <fieldset disabled={!ready||saving} className="min-w-0">
    <legend className="sr-only">{group}</legend>
    <div className="grid min-w-0 gap-3 md:grid-cols-2">
    {keys.filter(spec=>spec.group===group).map(spec=><label key={spec.key} className="grid min-w-0 gap-[6px] border-b border-border py-3 text-[13px] text-[var(--lms-neutral-400)] font-semibold leading-4">
     <span className="flex flex-wrap items-center gap-2 font-semibold">{spec.label}{spec.dangerous?<StatusBadge tone="warning">High impact</StatusBadge>:null}</span>
     <span className="break-all font-mono text-xs text-muted-foreground">{spec.key}</span>
     {spec.dangerous||spec.key.startsWith("otp.")?<StatusBadge tone="warning">Stored · runtime activation unverified</StatusBadge>:null}
     <span className="text-xs font-normal leading-5 text-body">{runtimeHint(spec)}</span>
     {spec.type==="textarea"?<Textarea rows={3} maxLength={4096} value={draft[spec.key]??""}
      aria-invalid={Boolean(invalidKeys.get(spec.key))}
      aria-describedby={invalidKeys.has(spec.key)?"tenant-invalid-"+spec.key:undefined}
      onChange={event=>setDraft(prev=>({...prev,[spec.key]:event.target.value}))}
      className="min-h-11 md:min-h-9 w-full"/>:
      <Input type={spec.type==="int"||spec.type==="decimal"?"number":"text"}
       min={"min" in spec?spec.min:undefined} max={"max" in spec?spec.max:undefined}
       step={spec.type==="int"?1:spec.type==="decimal"?"any":undefined}
       value={draft[spec.key]??""} maxLength={4096}
       aria-invalid={Boolean(invalidKeys.get(spec.key))}
       aria-describedby={invalidKeys.has(spec.key)?"tenant-invalid-"+spec.key:undefined}
       onChange={event=>setDraft(prev=>({...prev,[spec.key]:event.target.value}))}
       className="min-h-11 md:min-h-9 w-full"/>}
     {invalidKeys.has(spec.key)?<span id={"tenant-invalid-"+spec.key} role="alert"
      className="text-xs font-semibold text-error">{invalidKeys.get(spec.key)}</span>:null}
     {"min" in spec&&spec.min!==undefined?<span className="text-xs text-muted-foreground">
       Range {spec.min}–{"max" in spec?spec.max:undefined}</span>:null}
    </label>)}
    </div>
   </fieldset>
  </Disclosure>)}
  <Disclosure title="Other stored keys" className="border-t border-border" contentClassName="pt-3">
   <div onInput={()=>setOtherDirty(true)}>
   {otherDirty?<p role="status" className="mb-3 text-xs text-warning-text">
    An unlisted-key add draft may still be unsaved. Scope navigation remains guarded until this editor is reloaded.
   </p>:null}
   <OtherTenantSettings scopeType={scopeType} collegeId={collegeId} ready={ready} entries={entries} showHeading={false}/>
   </div>
  </Disclosure>
  <div className="flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center">
   <Button variant="primary" type="button" loading={saving} disabled={!ready||saving} className="min-h-11 w-full sm:min-h-9 sm:w-auto" onClick={()=>void save()}>
    {saving?"Saving…":changed.length?"Save "+changed.length+" changed setting"+(changed.length===1?"":"s"):"Save settings"}
   </Button>
   <span className="text-xs text-muted-foreground">Each key is saved independently, with an audit record.</span>
  </div>
  {error?<Alert tone="error" role="alert">{error}</Alert>:null}
  <ConfirmDialog open={leaveHref!==null}
   onOpenChange={open=>{if(!open)setLeaveHref(null);}}
   title="Discard unsaved tenant settings?"
   description="You have unsaved tenant settings or an unfinished add draft. Leave without saving? This does not apply the pending values."
   confirmLabel="Leave without saving" confirmVariant="danger"
   onConfirm={()=>{
    if(!leaveHref)return;
    bypassUnload.current=true;
    const destination=leaveHref;
    setLeaveHref(null);
    router.push(destination);
   }}/>
  <ConfirmDialog open={impactConfirm} onOpenChange={setImpactConfirm}
   title="Review high-impact tenant setting changes"
   description="Host, authentication and messaging overrides can lock users out if deployed incorrectly. Review every changed key and activate only through the approved deployment process."
   confirmLabel="Save reviewed overrides" confirmVariant="primary" pending={saving}
   confirmDisabled={!ready||changed.length===0}
   onConfirm={()=>{void save(true);}}>
    <div className="space-y-2 text-sm text-body">
     <p>Scope: {scopeType==="GLOBAL"?"Global":"Selected college"}. {changed.length} changed setting(s); {changed.filter(item=>item.dangerous).length} high impact.</p>
     <ul role="region" aria-label="High-impact settings review" tabIndex={0} className="max-h-48 list-disc space-y-1 overflow-auto overscroll-contain pl-5 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
      {changed.map(spec=><li key={spec.key} className="break-all">{spec.label} ({spec.key})</li>)}
     </ul>
     <p>Blank values restore the source default. These saved overrides do not automatically reconfigure deployment-managed authentication or SMS services.</p>
    </div>
  </ConfirmDialog>
  {results.length>0?<div role="status" className="space-y-2">
   <h3 className="font-semibold text-[var(--lms-heading)]">Save results</h3>
   <ul role="region" aria-label="Tenant settings change results" tabIndex={0} className="max-h-60 divide-y divide-border overflow-auto overscroll-contain text-sm focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">{results.map(row=><li key={row.key} className="flex min-w-0 flex-wrap items-center gap-2 py-3">
    <strong className="break-all">{row.key}</strong><StatusBadge tone={row.status==="SAVED"?"success":row.status==="DELETED"?"info":"error"}>{row.status}</StatusBadge><span className="min-w-0 break-words text-body">{row.message}</span></li>)}</ul>
  </div>:null}
 </section>;
}

"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {LEGACY_TENANT_SETTING_SPECS} from "@/modules/platform-settings/legacy-setting-specs";
type Entry={key:string;value:string;version:number};
type Result={key:string;status:"SAVED"|"DELETED"|"FAILED";message:string;version?:number};
export function TenantSettingsEditor({scopeType,collegeId,ready,entries}:{
 scopeType:"GLOBAL"|"COLLEGE";collegeId?:string;ready:boolean;entries:readonly Entry[];
}){
 const router=useRouter();
 const keys=LEGACY_TENANT_SETTING_SPECS.filter(item=>item.scope===scopeType);
 const existing=new Map(entries.map(row=>[row.key,row]));
 const [draft,setDraft]=useState<Record<string,string>>(()=>Object.fromEntries(
  keys.map(spec=>[spec.key,existing.get(spec.key)?.value??""])));
 const [saving,setSaving]=useState(false),[results,setResults]=useState<Result[]>([]),
  [error,setError]=useState("");
 const changed=keys.filter(item=>draft[item.key]!== (existing.get(item.key)?.value??""));
 const impact=changed.some(item=>item.dangerous);
 const [impactConfirm,setImpactConfirm]=useState(false);
 async function save(confirmedHighImpact=false){
  if(!ready||saving||changed.length===0)return;
  if(impact&&!confirmedHighImpact){setImpactConfirm(true);return;}
  setImpactConfirm(false);
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
   const data=await response.json() as {results:Result[];saved:number;failed:number};
   setResults(data.results);router.refresh();
  }catch(cause){setError(cause instanceof Error?cause.message:"Save failed");}
  finally{setSaving(false);}
 }
 const groups=[...new Set(keys.map(spec=>spec.group))];
 return <section aria-label="Edit Tenant Settings" className="space-y-5 rounded-xl border border-border bg-surface p-5">
  <h2 className="text-lg font-semibold">Edit Tenant Settings</h2>
  <p className="text-sm text-body">Scope: {scopeType==="GLOBAL"?"Global":"Selected college"}. Blank values restore the source default.
   Each field has its legacy validation range. Platform security overrides require a separate rollout before taking effect.</p>
  {!ready?<p role="status" className="text-warning-text">The tenant-settings migration is pending. This form is read-only.</p>:null}
  {groups.map(group=><fieldset disabled={!ready||saving} key={group} className="space-y-3">
   <legend className="mb-2 text-base font-semibold">{group}</legend>
   <div className="grid gap-3 md:grid-cols-2">
    {keys.filter(spec=>spec.group===group).map(spec=><label key={spec.key} className="grid min-w-0 gap-1 rounded-md border border-border p-3 text-sm">
     <span className="font-semibold">{spec.label}{spec.dangerous?" · High impact":""}</span>
     <span className="break-all font-mono text-xs text-muted-foreground">{spec.key}</span>
     {spec.type==="textarea"?<textarea rows={3} maxLength={4096} value={draft[spec.key]??""}
      onChange={event=>setDraft(prev=>({...prev,[spec.key]:event.target.value}))}
      className="rounded-md border border-border bg-background p-2"/>:
      <input type={spec.type==="int"||spec.type==="decimal"?"number":"text"}
       min={"min" in spec?spec.min:undefined} max={"max" in spec?spec.max:undefined}
       step={spec.type==="int"?1:spec.type==="decimal"?"any":undefined}
       value={draft[spec.key]??""} maxLength={4096}
       onChange={event=>setDraft(prev=>({...prev,[spec.key]:event.target.value}))}
       className="min-h-10 rounded-md border border-border bg-background px-2"/>}
     {"min" in spec&&spec.min!==undefined?<span className="text-xs text-muted-foreground">
       Range {spec.min}–{"max" in spec?spec.max:undefined}</span>:null}
    </label>)}
   </div>
  </fieldset>)}
  <div className="flex flex-wrap items-center gap-3">
   <button type="button" disabled={!ready||saving||changed.length===0} onClick={()=>void save()}
    className="min-h-11 rounded-md bg-primary px-4 font-semibold text-on-primary disabled:opacity-50">
    {saving?"Saving…":"Save "+changed.length+" changed setting"+(changed.length===1?"":"s")}
   </button>
   <span className="text-xs text-muted-foreground">Each key is saved independently, with an audit record.</span>
  </div>
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  <ConfirmDialog open={impactConfirm} onOpenChange={setImpactConfirm}
   title="Review high-impact tenant setting changes"
   description="Host, authentication and messaging overrides can lock users out if deployed incorrectly. Review every changed key and activate only through the approved deployment process."
   confirmLabel="Save reviewed overrides" pending={saving}
   confirmDisabled={!ready||changed.length===0}
   onConfirm={()=>{void save(true);}}>
    <div className="space-y-2 text-sm text-body">
     <p>Scope: {scopeType==="GLOBAL"?"Global":"Selected college"}. {changed.length} changed setting(s); {changed.filter(item=>item.dangerous).length} high impact.</p>
     <ul className="max-h-48 list-disc space-y-1 overflow-auto pl-5">
      {changed.map(spec=><li key={spec.key} className="break-all">{spec.label} ({spec.key})</li>)}
     </ul>
     <p>Blank values restore the source default. These saved overrides do not automatically reconfigure deployment-managed authentication or SMS services.</p>
    </div>
  </ConfirmDialog>
  {results.length>0?<div role="status" className="space-y-2">
   <h3 className="font-semibold">Save results</h3>
   <ul className="max-h-60 space-y-1 overflow-auto text-sm">{results.map(row=><li key={row.key} className="rounded border border-border p-2">
    <strong>{row.key}</strong> — {row.status}: {row.message}</li>)}</ul>
  </div>:null}
 </section>;
}

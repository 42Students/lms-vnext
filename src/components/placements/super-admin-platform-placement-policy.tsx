"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PlacementPolicyKey } from "@/modules/placements/platform-placement-policy-model";
type Field={key:PlacementPolicyKey;label:string;unit:string;value:number;defaultValue:number;version:number;
 min:number;max:number;step:number;isOverridden:boolean;updatedAt:string|null};
export function SuperAdminPlatformPlacementPolicy({initial}:{initial:Field[]}) {
 const router=useRouter();
 const [fields,setFields]=useState(initial);
 const [drafts,setDrafts]=useState<Record<string,string>>({});
 const [busy,setBusy]=useState<string|null>(null);
 const [error,setError]=useState<string|null>(null);
 const [notice,setNotice]=useState<string|null>(null);
 async function refresh(){
  setBusy("reload");setError(null);
  try{
   const response=await fetch("/api/admin/placements/platform-policy",{cache:"no-store"});
   if(!response.ok)throw new Error("Could not reload placement policy.");
   const data=await response.json() as {fields:Field[]};
   setFields(data.fields);setDrafts({});setNotice("Current policy reloaded.");
  }catch(e){setError(e instanceof Error?e.message:"Unable to reload policy.");}
  finally{setBusy(null);}
 }
 async function submit(field:Field,reset:boolean){
  if(busy)return;
  const value=reset?null:Number(drafts[field.key]??String(field.value));
  if(value!==null&&(Number.isNaN(value)||value<field.min||value>field.max||
    (field.step===1&&!Number.isInteger(value)))){
    setError("Enter a value within the allowed range.");return;
  }
  setBusy(field.key);setError(null);setNotice(null);
  try{
   const response=await fetch("/api/admin/placements/platform-policy",{
    method:"PUT",headers:{"content-type":"application/json"},
    body:JSON.stringify({key:field.key,value,expectedVersion:field.version}),
   });
   if(!response.ok) {
    const body=await response.json().catch(()=>null);
    throw new Error(response.status===409?"The policy changed. Reload before saving.":body?.error??"Could not save policy.");
   }
   const next=await fetch("/api/admin/placements/platform-policy",{cache:"no-store"});
   if(!next.ok)throw new Error("Saved, but could not refresh. Reload the page.");
   const payload=await next.json() as {fields:Field[]};
   setFields(payload.fields);
   setDrafts(current=>({...current,[field.key]:""}));
   setNotice(reset?"Default restored.":"Policy saved.");
   router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Policy update failed.");}
  finally{setBusy(null);}
 }
 return <section aria-labelledby="platform-placement-policy" className="min-w-0 space-y-[var(--lms-space-4)] rounded-[var(--lms-control-radius)] border border-border bg-surface p-[var(--lms-space-4)]">
  <div className="flex min-w-0 flex-col gap-[var(--lms-space-3)] sm:flex-row sm:items-center sm:justify-between">
   <div><h2 id="platform-placement-policy" className="text-lg font-semibold text-foreground">Placements policy</h2>
    <p className="text-sm text-muted-foreground">Platform-wide defaults. Clear the college selection to review global settings. Changes require Super Admin access.</p>
   </div>
   <Button type="button" variant="secondary" disabled={Boolean(busy)} onClick={()=>void refresh()}>Reload</Button>
  </div>
  <div className="grid min-w-0 gap-x-6 gap-y-[var(--lms-space-3)] sm:grid-cols-2">
   {fields.map(field=><div key={field.key} className="min-w-0 space-y-[var(--lms-space-2)] border-b border-border py-[var(--lms-space-3)]">
     <label htmlFor={"policy-"+field.key} className="block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">{field.label}</label>
     <p className="text-xs text-muted-foreground">Default: {field.defaultValue} {field.unit} · Allowed: {field.min}–{field.max} {field.unit} · {field.isOverridden?"Overridden":"Using default"}</p>
     <div className="flex flex-wrap items-center gap-2">
      <Input id={"policy-"+field.key} type="number" min={field.min} max={field.max} step={field.step}
       value={drafts[field.key]??String(field.value)}
       onChange={event=>setDrafts(current=>({...current,[field.key]:event.target.value}))}
       className="min-h-11 min-w-0 flex-1 md:min-h-9" />
      <span className="text-xs text-muted-foreground">{field.unit}</span>
     </div>
     <div className="flex min-w-0 flex-col gap-[var(--lms-space-2)] sm:flex-row sm:flex-wrap">
      <Button type="button" disabled={Boolean(busy)} onClick={()=>void submit(field,false)}>Save</Button>
      <Button type="button" variant="secondary" disabled={Boolean(busy)||!field.isOverridden} onClick={()=>void submit(field,true)}>Reset to default</Button>
     </div>
   </div>)}
  </div>
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  {notice?<p role="status" className="text-sm text-body">{notice}</p>:null}
 </section>;
}

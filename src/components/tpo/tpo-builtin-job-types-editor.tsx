"use client";
import {Checkbox} from "@/components/ui/checkbox";
import {Button} from "@/components/ui/button";
import {DataTable} from "@/components/ui/data-table";
import {EmptyState} from "@/components/ui/empty-state";
import {useConfirmFlow} from "@/components/ui/use-confirm-flow";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {TPO_BUILTIN_JOB_TYPES} from "@/modules/placements/tpo-builtin-job-types";
type Stored={label:string;active:boolean;countsAsPlaced:boolean|null;isBuiltin:boolean;updatedAt:string};
export function TpoBuiltinJobTypesEditor({stored,customActive}:{stored:readonly Stored[];customActive:number}){
 const router=useRouter(),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const {askConfirm,dialog}=useConfirmFlow();
 const rows=TPO_BUILTIN_JOB_TYPES.map(fixed=>({
  ...fixed,override:stored.find(item=>item.label===fixed.label),
 }));
 const activeCount=customActive+rows.filter(row=>row.override?.active??true).length;
 async function change(label:string,active:boolean,expectedVersion:string){
  if(busy || !(await askConfirm((active?"Show ":"Hide ")+label+" in the drive form? Existing drives keep their recorded employment type.")))return;
  setBusy(true);setError("");
  try{
   const response=await fetch("/api/placements/tpo/settings/job-types/builtin",{
    method:"PATCH",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({label,active,expectedVersion}),
   });
   const data=await response.json() as {error?:string};
   if(!response.ok)throw Error(data.error==="TPO_SETTINGS_STALE"?"Settings changed; refresh and retry.":
    data.error==="TPO_JOB_TYPE_LAST_ACTIVE"?"Keep at least one job type visible.":
    "Could not save this job type. Refresh and try again.");
   router.refresh();
   }catch(e){setError("Job types were not saved. "+
    (e instanceof Error?e.message:"Please try again."));}finally{setBusy(false);}
 }
 return <section className="space-y-3 border-t border-border pt-4">
  {dialog}
  <h3 className="font-semibold">Built-in job types</h3>
  <p className="text-sm text-muted-foreground">Their names and counts-as-placed answers are fixed. Switching off a type hides it from the college&apos;s available choices; existing drives keep their type.</p>
  <DataTable rows={rows} getRowKey={row=>row.label} caption="Built-in job types"
   empty={<EmptyState title="No built-in job types available."/>}
   columns={[
    {key:"jobType",header:"Job type",mobilePriority:"primary",cell:row=><span className="font-medium">{row.label} <span className="text-xs text-muted-foreground">Built-in</span></span>},
    {key:"placed",header:"Counts as placed",mobilePriority:"secondary",cell:row=>row.countsAsPlaced?"Yes":"No"},
    {key:"enabled",header:"In the drive form",mobilePriority:"action",cell:row=><label className="inline-flex min-h-11 min-[768px]:min-h-9 items-center gap-2 py-1">
     <Checkbox checked={row.override?.active??true} disabled={busy||((row.override?.active??true)&&activeCount<=1)}
      aria-label={row.label+" in the drive form"} onChange={event=>void change(row.label,event.target.checked,row.override?.updatedAt??"none")}/>
     {(row.override?.active??true)?"On":"Off"}
    </label>},
   ]}/>
  <p className="text-xs text-muted-foreground">Internship never counts as placed; Internship + full-time counts once the full-time offer is made. Drive consumers must load the authoritative college choice list.</p>
  {error?<div role="alert" className="space-y-2 border border-border p-3 text-sm text-error">
    <p>{error}</p>
    <div className="flex gap-2">
     <Button type="button" variant="secondary" disabled={busy}
      onClick={()=>router.refresh()}>Retry</Button>
     <Button type="button" variant="secondary" onClick={()=>setError("")}>Dismiss</Button>
    </div>
   </div>:null}
 </section>;
}

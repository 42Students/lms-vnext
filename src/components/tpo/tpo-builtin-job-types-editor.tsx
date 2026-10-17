"use client";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {TPO_BUILTIN_JOB_TYPES} from "@/modules/placements/tpo-builtin-job-types";
type Stored={label:string;active:boolean;countsAsPlaced:boolean|null;isBuiltin:boolean;updatedAt:string};
export function TpoBuiltinJobTypesEditor({stored,customActive}:{stored:readonly Stored[];customActive:number}){
 const router=useRouter(),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const rows=TPO_BUILTIN_JOB_TYPES.map(fixed=>({
  ...fixed,override:stored.find(item=>item.label===fixed.label),
 }));
 const activeCount=customActive+rows.filter(row=>row.override?.active??true).length;
 async function change(label:string,active:boolean,expectedVersion:string){
  if(!window.confirm((active?"Show ":"Hide ")+label+" in the drive form? Existing drives keep their recorded employment type."))return;
  setBusy(true);setError("");
  try{
   const response=await fetch("/api/placements/tpo/settings/job-types/builtin",{
    method:"PATCH",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({label,active,expectedVersion}),
   });
   const data=await response.json() as {error?:string};
   if(!response.ok)throw Error(data.error==="TPO_SETTINGS_STALE"?"Settings changed; refresh and retry.":
    data.error==="TPO_JOB_TYPE_LAST_ACTIVE"?"Keep at least one job type visible.":
    data.error??"Could not save this job type.");
   router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Unable to change type");}finally{setBusy(false);}
 }
 return <section className="space-y-3 rounded-xl border border-border bg-surface p-4">
  <h3 className="font-semibold">Built-in job types</h3>
  <p className="text-sm text-muted-foreground">Their names and counts-as-placed answers are fixed. Switching off a type hides it from the college's available choices; existing drives keep their type.</p>
  <div className="overflow-x-auto"><table className="w-full min-w-[24rem] text-left text-sm">
   <thead><tr className="border-b border-border"><th scope="col" className="p-2">Job type</th><th scope="col" className="p-2">Counts as placed</th><th scope="col" className="p-2">In the drive form</th></tr></thead>
   <tbody>{rows.map(row=><tr className="border-b border-border" key={row.label}>
    <th scope="row" className="p-2 font-medium">{row.label} <span className="text-xs text-muted-foreground">Built-in</span></th>
    <td className="p-2">{row.countsAsPlaced?"Yes":"No"}</td>
    <td className="p-2"><label className="inline-flex min-h-10 items-center gap-2">
     <input type="checkbox" checked={row.override?.active??true} disabled={busy||((row.override?.active??true)&&activeCount<=1)}
      aria-label={row.label+" in the drive form"} onChange={e=>void change(row.label,e.target.checked,row.override?.updatedAt??"none")}/>
     {(row.override?.active??true)?"On":"Off"}
    </label></td>
   </tr>)}</tbody></table></div>
  <p className="text-xs text-muted-foreground">Internship never counts as placed; Internship + full-time counts once the full-time offer is made. Drive consumers must load the authoritative college choice list.</p>
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
 </section>;
}

"use client";
import {FilterChip} from "@/components/ui/filter-chip";
import { InlineNotice } from "@/components/ui/inline-notice";
import {useConfirmFlow} from "@/components/ui/use-confirm-flow";
import {useRouter} from "next/navigation";
import {useState} from "react";
export function TpoCustomJobTypePlaced({id,label,version,value}:{id:string;label:string;version:string;value:boolean|null}){
 const router=useRouter(),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const {askConfirm,dialog}=useConfirmFlow();
 async function update(next:boolean){
  if(busy||next===value)return;
  if(!(await askConfirm("Change what counts as placed? Offers from "+label+
   " will change the placed rule on all linked drives, including archived records, and may change placement percentages and reports. Verify the affected drives before continuing.")))return;
  setBusy(true);setError("");
  try{
   const response=await fetch("/api/placements/tpo/settings/job-types/"+encodeURIComponent(id)+"/placed",{
    method:"PATCH",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({countsAsPlaced:next,expectedVersion:version}),
   });
   const data=await response.json() as {error?:string};
   if(!response.ok)throw Error(data.error==="TPO_SETTINGS_STALE"?"Settings changed; refresh and try again.":
    data.error??"Could not save placed rule.");
   router.refresh();
  }catch(caught){setError(caught instanceof Error?caught.message:"Unable to save");}
  finally{setBusy(false);}
 }
 return <div className="space-y-1 text-sm">
  <p className="text-xs text-muted-foreground">Counts as placed</p>
  <div className="flex gap-2">
   <FilterChip type="button" disabled={busy} aria-pressed={value===true} onClick={()=>void update(true)}
    className="min-h-11 md:min-h-8">Yes</FilterChip>
   <FilterChip type="button" disabled={busy} aria-pressed={value===false} onClick={()=>void update(false)}
    className="min-h-11 md:min-h-8">No</FilterChip>
  </div>
  {value===null?<p className="text-xs text-muted-foreground">Not decided</p>:null}
  {error?<InlineNotice tone="error" message={error}/>:null}
  {dialog}
 </div>;
}

"use client";
import {Button} from "@/components/ui/button";
import {useRouter} from "next/navigation";
import {useState} from "react";
export function TpoCustomJobTypePlaced({id,label,version,value}:{id:string;label:string;version:string;value:boolean|null}){
 const router=useRouter(),[busy,setBusy]=useState(false),[error,setError]=useState("");
 async function update(next:boolean){
  if(busy||next===value)return;
  if(!window.confirm("Change what counts as placed? Offers from "+label+
   " may change placement numbers once the drive and report consumers are connected."))return;
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
   <Button variant="secondary" type="button" disabled={busy} aria-pressed={value===true} onClick={()=>void update(true)}
    className={"min-h-11 sm:min-h-9 px-3 "+(value===true?"border-primary bg-primary-subtle":"border-border")}>Yes</Button>
   <Button variant="secondary" type="button" disabled={busy} aria-pressed={value===false} onClick={()=>void update(false)}
    className={"min-h-11 sm:min-h-9 px-3 "+(value===false?"border-primary bg-primary-subtle":"border-border")}>No</Button>
  </div>
  {value===null?<p className="text-xs text-muted-foreground">Not decided</p>:null}
  {error?<p role="alert" className="text-xs text-error">{error}</p>:null}
 </div>;
}

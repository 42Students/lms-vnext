"use client";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {useRouter} from "next/navigation";
import {useState} from "react";
export function TpoCustomJobTypeRename({id,label,version}:{id:string;label:string;version:string}){
 const router=useRouter();
 const [name,setName]=useState(label),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const changed=name.trim()!==label;
 async function save(){
  if(busy||!changed||name.trim().length<2||name.trim().length>40)return;
  if(!window.confirm("Rename this custom job type? Existing drives are not rewritten by this change."))return;
  setBusy(true);setError("");
  try{
   const response=await fetch("/api/placements/tpo/settings/job-types/"+encodeURIComponent(id),{
    method:"PUT",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({label:name.trim(),expectedVersion:version}),
   });
   const result=await response.json() as {error?:string};
   if(!response.ok)throw Error(result.error==="TPO_SETTINGS_STALE"?"Settings changed. Refresh and try again.":
     result.error==="TPO_JOB_TYPE_EXISTS"?"This name is already in use.":
     result.error==="TPO_JOB_TYPE_BUILTIN"?"Built-in names cannot be used for custom types.":
     result.error??"Could not rename job type.");
   router.refresh();
  }catch(caught){setError(caught instanceof Error?caught.message:"Unable to save");}
  finally{setBusy(false);}
 }
 return <div className="min-w-0 space-y-1">
  <label className="text-xs text-muted-foreground">Custom job type name
   <Input value={name} maxLength={40} disabled={busy} onChange={e=>setName(e.target.value)}
    className="mt-1 min-h-11 sm:min-h-9 min-w-0 text-sm"/>
  </label>
  <Button variant="secondary" type="button" disabled={busy||!changed||name.trim().length<2} onClick={()=>void save()}
   className="min-h-11 sm:min-h-9 text-xs">Rename</Button>
  {error?<p role="alert" className="max-w-xs text-xs text-error">{error}</p>:null}
 </div>;
}

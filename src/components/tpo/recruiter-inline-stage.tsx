import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
"use client";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {useState} from "react";
export function RecruiterInlineStage({lead,onUpdated}:{lead:{id:string;name:string;manualStage:string;stage:string};onUpdated:()=>void}){
 const [open,setOpen]=useState(false),[action,setAction]=useState<"CONTACTED"|"NOT_NOW">("CONTACTED");
 const [reason,setReason]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
 async function save(){
  if(busy||action==="NOT_NOW"&&!reason.trim()){setError("Give a reason for Not now.");return}
  setBusy(true);setError("");
  try{
   const response=await fetch("/api/placements/tpo/leads/bulk-stage",{
    method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({action,confirmed:true,selections:[{id:lead.id,expectedStage:lead.manualStage}],
     ...(action==="NOT_NOW"?{reason:reason.trim(),revisitDate:null}:{})}),
   });
   const data=await response.json() as {results?:{status:string;reason:string|null}[]};
   const result=data.results?.[0];
   if(!response.ok||!result||result.status==="ineligible")
    throw new Error(result?.reason??"Stage changed. Refresh and retry.");
   setOpen(false);onUpdated();
  }catch(e){setError(e instanceof Error?e.message:"Couldn't change stage");}
  finally{setBusy(false);}
 }
 return <div className="min-w-28 space-y-2">
  <Button variant="ghost" type="button" aria-label={"Edit stage for "+lead.name}
    onClick={()=>setOpen(value=>!value)}>
   {lead.stage.replaceAll("_"," ")} · Edit
  </Button>
  {open?<div className="space-y-2">
   <label className="block text-xs">Stage
    <Select value={action} disabled={busy} onChange={e=>setAction(e.target.value as typeof action)}
     className="min-h-10 w-full rounded border border-border bg-surface">
     <option value="CONTACTED">Contacted</option><option value="NOT_NOW">Not now</option>
    </Select>
   </label>
   {action==="NOT_NOW"?<label className="block text-xs">Reason
    <Input value={reason} maxLength={255} onChange={e=>setReason(e.target.value)}
     className="min-h-10 w-full rounded border border-border bg-surface px-2"/>
   </label>:null}
   <Button variant="primary" type="button" disabled={busy} onClick={()=>void save()}
    className="min-h-10 px-3">Apply</Button>
   <Button variant="ghost" type="button" disabled={busy} onClick={()=>setOpen(false)}
    className="ml-2 min-h-10">Cancel</Button>
  </div>:null}
  {error?<p role="alert" className="text-xs text-warning">{error}</p>:null}
 </div>;
}

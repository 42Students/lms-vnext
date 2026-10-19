import { Select } from "@/components/ui/select";
"use client";
import {useState} from "react";
type Owner={membershipId:string;displayName:string|null};
export function RecruiterInlineOwner({lead,onUpdated}:{
 lead:{id:string;name:string;ownerName:string|null;ownerMembershipId:string|null};
 onUpdated:()=>void;
}){
 const [open,setOpen]=useState(false),[loading,setLoading]=useState(false);
 const [owners,setOwners]=useState<Owner[]>([]);
 const [target,setTarget]=useState(""),[error,setError]=useState("");
 async function begin(){
  setOpen(true);setLoading(true);setError("");
  try{
   const r=await fetch("/api/placements/tpo/leads/bulk-owner",{cache:"no-store",credentials:"same-origin"});
   if(!r.ok)throw new Error("Could not load placement staff");
   const data=await r.json() as {owners:Owner[]};
   setOwners(data.owners??[]);
  }catch(e){setError(e instanceof Error?e.message:"Owner lookup failed");}
  finally{setLoading(false);}
 }
 async function apply(){
  if(!target||loading)return;
  setLoading(true);setError("");
  try{
   const r=await fetch("/api/placements/tpo/leads/bulk-owner",{
    method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({confirmed:true,ownerMembershipId:target,
     selections:[{id:lead.id,expectedOwnerMembershipId:lead.ownerMembershipId}]}),
   });
   const data=await r.json() as {results?:{status:string;reason:string|null}[]};
   const item=data.results?.[0];
   if(!r.ok||!item||item.status==="ineligible")
    throw new Error(item?.reason??"Could not assign owner. Refresh and retry.");
   setOpen(false);onUpdated();
  }catch(e){setError(e instanceof Error?e.message:"Could not assign owner");}
  finally{setLoading(false);}
 }
 return <div className="min-w-28 space-y-2">
  <button type="button" aria-label={"Change owner for "+lead.name}
   className="text-primary-text underline" onClick={()=>open?setOpen(false):void begin()}>
   {lead.ownerName??"Unassigned"} · Edit
  </button>
  {open?<div className="space-y-2">
   {loading?<p role="status" className="text-xs">Loading…</p>:null}
   <label className="block text-xs">Owner
    <Select value={target} onChange={e=>setTarget(e.target.value)}
     className="min-h-10 w-full rounded border border-border bg-surface" disabled={loading}>
     <option value="">Select staff</option>
     {owners.map(item=><option key={item.membershipId} value={item.membershipId}>
      {item.displayName??"Placement staff"}</option>)}
    </Select>
   </label>
   <button type="button" disabled={loading||!target} onClick={()=>void apply()}
    className="min-h-10 rounded bg-primary px-3 text-xs text-on-primary">Assign</button>
   <button type="button" onClick={()=>setOpen(false)} className="ml-2 min-h-10 text-xs text-primary-text">Cancel</button>
  </div>:null}
  {error?<p role="alert" className="text-xs text-warning">{error}</p>:null}
 </div>;
}

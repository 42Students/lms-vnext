"use client";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {afterCollegeOptions,type AfterCollegeOutcome} from "@/modules/placements/tpo-after-college-model";
const OPTIONS=afterCollegeOptions();
export function TpoAfterCollegeEditor({membershipId,outcome,expectedVersion}:{
 membershipId:string;outcome:AfterCollegeOutcome|null;expectedVersion:string;
}){
 const router=useRouter(),[selected,setSelected]=useState<AfterCollegeOutcome>(outcome??"NOT_DECIDED"),
 [busy,setBusy]=useState(false),[error,setError]=useState("");
 async function save(){
  if(busy)return;setBusy(true);setError("");
  try{
   const response=await fetch("/api/placements/tpo/students/"+membershipId+"/after-college",{
    method:"PUT",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({outcome:selected,expectedVersion}),
   });
   const data=await response.json() as {error?:string};
   if(!response.ok)throw Error(response.status===409?"Outcome changed. Refresh before saving.":data.error??"Unable to save outcome.");
   router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Unable to save outcome.");}finally{setBusy(false);}
 }
 return <div className="min-w-0 space-y-2">
  <label className="block text-xs">After college
   <select value={selected} disabled={busy} onChange={e=>setSelected(e.target.value as AfterCollegeOutcome)}
    className="mt-1 min-h-10 w-full min-w-0 rounded border border-border bg-surface px-2 text-xs">
    {OPTIONS.map(item=><option key={item.value} value={item.value}>{item.label}</option>)}
   </select></label>
  <button type="button" onClick={()=>void save()} disabled={busy||selected===(outcome??"NOT_DECIDED")}
   className="min-h-10 rounded border border-border px-3 text-xs disabled:opacity-50">
   {busy?"Saving…":"Save outcome"}</button>
  {error?<p role="alert" className="max-w-48 break-words text-xs text-error">{error}</p>:null}
 </div>;
}

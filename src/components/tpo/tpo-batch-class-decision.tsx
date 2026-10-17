"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
type Decision="ELIGIBLE"|"INELIGIBLE"|"NOT_DECIDED";
export function TpoBatchClassDecision({batchId,classId,initial,expectedVersion,finished}:{
 batchId:string;classId:string;initial:string;expectedVersion:string;finished:boolean;
}){
 const router=useRouter(),[choice,setChoice]=useState<Decision>(
  initial==="ELIGIBLE"?"ELIGIBLE":initial==="INELIGIBLE"?"INELIGIBLE":"NOT_DECIDED");
 const [reason,setReason]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const changed=choice!==initial;
 async function submit(){
  if(busy||!changed||finished)return;
  if(choice==="INELIGIBLE"&&reason.trim().length<3){setError("Provide a reason for ineligible decisions.");return;}
  if(!window.confirm("Set this class to "+choice.replaceAll("_"," ").toLowerCase()+"? Student overrides are not changed."))return;
  setBusy(true);setError("");
  try{
   const response=await fetch("/api/placements/tpo/batches/"+encodeURIComponent(batchId)+"/classes/"+encodeURIComponent(classId)+"/decision",{
    method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({
     decision:choice,expectedVersion,...(choice==="INELIGIBLE"?{reason:reason.trim()}:{}),
    }),
   });
   const data=await response.json().catch(()=>null);
   if(!response.ok)throw new Error(response.status===409?"Class decision changed; refresh and retry.":data?.error??"Could not save class decision.");
   router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Class decision failed.");}
  finally{setBusy(false);}
 }
 return <div className="space-y-2">
  <div className="flex flex-wrap items-end gap-2">
   <label className="grid gap-1 text-sm font-semibold">Who is in
    <select value={choice} onChange={e=>{setChoice(e.target.value as Decision);setError("");}} disabled={busy||finished}
     className="min-h-10 rounded-md border border-border bg-surface px-3">
     <option value="NOT_DECIDED">Follows the batch</option>
     <option value="ELIGIBLE">Eligible</option>
     <option value="INELIGIBLE">Ineligible</option>
    </select>
   </label>
   <button type="button" onClick={()=>void submit()} disabled={busy||finished||!changed}
    className="min-h-10 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-50">
    {busy?"Saving…":"Save"}
   </button>
  </div>
  {choice==="INELIGIBLE"?<label className="grid gap-1 text-sm">Reason
   <textarea value={reason} onChange={e=>setReason(e.target.value)} maxLength={200} rows={2}
    disabled={busy||finished} className="w-full rounded-md border border-border bg-surface p-2" placeholder="Reason for ineligible decision"/>
  </label>:null}
  {error?<p role="alert" className="text-xs text-error">{error}</p>:null}
 </div>;
}

"use client";
import {useRouter} from "next/navigation";
import {useState} from "react";
type JobType={id:string;label:string;active:boolean;updatedAt:string};
export function TpoJobTypesEditor({types}:{types:readonly JobType[]}){
 const router=useRouter(),[label,setLabel]=useState("");
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[message,setMessage]=useState("");
 async function send(url:string,method:"POST"|"PATCH",payload:Record<string,unknown>){
  setBusy(true);setError("");setMessage("");
  try{
   const response=await fetch(url,{method,credentials:"same-origin",
    headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
   const data=await response.json() as {error?:string};
   if(!response.ok)throw Error(response.status===409?"Settings changed. Refresh before retrying.":data.error??"Unable to save setting.");
   setMessage("Job types updated.");router.refresh();
   if(method==="POST")setLabel("");
  }catch(e){setError(e instanceof Error?e.message:"Unable to save setting.");}
  finally{setBusy(false);}
 }
 return <section className="min-w-0 space-y-4 rounded-xl border border-border bg-surface p-4">
  <h3 className="font-semibold">Manage job types</h3>
  <form className="flex flex-wrap items-end gap-2" onSubmit={event=>{
   event.preventDefault();if(!label.trim()||busy)return;
   void send("/api/placements/tpo/settings/job-types","POST",{label:label.trim()});
  }}>
   <label className="min-w-0 flex-1 text-sm">New job type
    <input className="mt-1 min-h-11 w-full rounded border border-border bg-surface px-3"
     maxLength={100} value={label} disabled={busy} onChange={event=>setLabel(event.target.value)}/>
   </label>
   <button type="submit" disabled={!label.trim()||busy} className="min-h-11 rounded bg-primary px-4 text-sm text-on-primary disabled:opacity-50">Add job type</button>
  </form>
  {types.length===0?<p role="status" className="text-sm text-muted-foreground">No custom job types yet.</p>:
   <ul className="space-y-2">{types.map(item=><li key={item.id} className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded border border-border p-3">
    <span className="min-w-0 break-words text-sm"><strong>{item.label}</strong> · {item.active?"Active":"Inactive"}</span>
    <button type="button" disabled={busy} onClick={()=>void send("/api/placements/tpo/settings/job-types/"+item.id,"PATCH",{
      active:!item.active,expectedVersion:item.updatedAt,
    })} className="min-h-10 rounded border border-border px-3 text-sm disabled:opacity-50">
      {item.active?"Switch off":"Reactivate"}
    </button></li>)}</ul>}
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  {message?<p role="status" className="text-sm">{message}</p>:null}
 </section>;
}

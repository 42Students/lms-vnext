"use client";
import {useRouter} from "next/navigation";
import {useState} from "react";
type BlockedDay={id:string;day:string;reason:string;updatedAt:string};
export function TpoBlockedDatesEditor({items}:{items:readonly BlockedDay[]}){
 const router=useRouter(),[day,setDay]=useState(""),[reason,setReason]=useState("");
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 async function request(url:string,method:"POST"|"DELETE",body:Record<string,unknown>){
  setBusy(true);setError("");setNotice("");
  try{
   const response=await fetch(url,{method,credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
   const data=await response.json() as {error?:string};
   if(!response.ok)throw Error(response.status===409?"This date changed. Refresh and try again.":data.error??"Unable to save date.");
   setNotice("Blocked dates updated.");if(method==="POST"){setDay("");setReason("");}
   router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Blocked dates could not be updated.");}finally{setBusy(false);}
 }
 return <section className="min-w-0 space-y-4">
  <form className="grid min-w-0 gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto]"
   onSubmit={e=>{e.preventDefault();if(!day||reason.trim().length<3||busy)return;
    void request("/api/placements/tpo/settings/blocked-dates","POST",{day,reason:reason.trim()});}}>
   <label className="text-sm">Calendar date<input type="date" required value={day} disabled={busy} onChange={e=>setDay(e.target.value)}
    className="mt-1 min-h-11 w-full rounded border border-border bg-surface px-2"/></label>
   <label className="text-sm">Why is this date unavailable?
    <input value={reason} disabled={busy} maxLength={500} required onChange={e=>setReason(e.target.value)}
     className="mt-1 min-h-11 w-full rounded border border-border bg-surface px-3"/></label>
   <button type="submit" className="min-h-11 self-end rounded bg-primary px-4 text-sm text-on-primary disabled:opacity-50"
    disabled={busy||!day||reason.trim().length<3}>Block date</button>
  </form>
  {items.length===0?<p role="status" className="text-sm text-muted-foreground">No dates have been blocked.</p>:
   <ul className="grid min-w-0 gap-2 sm:grid-cols-2">{items.map(item=><li key={item.id}
    className="flex min-w-0 flex-wrap justify-between gap-3 rounded-lg border border-border bg-surface p-3">
    <div className="min-w-0"><strong>{item.day}</strong><p className="break-words text-sm">{item.reason}</p></div>
    <button type="button" disabled={busy} onClick={()=>{
     if(!window.confirm("Remove this blocked date?"))return;
     void request("/api/placements/tpo/settings/blocked-dates/"+item.id,"DELETE",{expectedVersion:item.updatedAt});
    }} className="min-h-10 rounded border border-border px-3 text-sm disabled:opacity-50">Remove</button></li>)}</ul>}
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  {notice?<p role="status" className="text-sm">{notice}</p>:null}
 </section>;
}

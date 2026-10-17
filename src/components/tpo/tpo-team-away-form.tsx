"use client";
import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
export function TpoTeamAwayForm({until}:{until:string|null}){
 const pending=useRef(false),router=useRouter();
 const [date,setDate]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
 async function submit(next:string|null){
  if(pending.current)return;
  pending.current=true;setBusy(true);setError("");
  try{
   await apiFetch("/api/placements/tpo/team/away",{
    method:"POST",credentials:"same-origin",timeoutMs:12000,
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({until:next,expectedUntil:until}),
   });
   router.refresh();
  }catch(reason){setError(reason instanceof Error?reason.message:"Could not save away status. Try again.");}
  finally{pending.current=false;setBusy(false);}
 }
 return <form className="mt-3 space-y-2"
  onSubmit={event=>{event.preventDefault();
   if(!date)return;const parsed=new Date(date+"+05:30");
   if(!Number.isFinite(parsed.getTime())){setError("Choose when you will be back.");return;}
   void submit(parsed.toISOString());}}>
  <label className="grid gap-1 text-xs font-semibold">Away until (IST)
   <input type="datetime-local" value={date} disabled={busy} onChange={event=>setDate(event.target.value)}
    className="min-h-11 rounded border border-border bg-surface px-3" />
  </label>
  {error?<p role="alert" className="text-xs text-danger">{error}</p>:null}
  <div className="flex flex-wrap gap-2">
   <button type="submit" disabled={busy||!date} className="min-h-11 rounded border border-border px-3 text-xs font-semibold">{busy?"Saving…":"Set away"}</button>
   {until?<button type="button" disabled={busy} className="min-h-11 rounded border border-border px-3 text-xs font-semibold"
    onClick={()=>void submit(null)}>Back now</button>:null}
  </div>
 </form>;
}

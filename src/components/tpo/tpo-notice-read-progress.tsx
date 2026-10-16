"use client";
import {useState} from "react";
type Summary={delivered:number;read:number;unread:string[];notDelivered:boolean};
export function TpoNoticeReadProgress({id}:{id:string}){
 const [data,setData]=useState<Summary|null>(null);
 const [error,setError]=useState(""),[busy,setBusy]=useState(false);
 const [reminder,setReminder]=useState("");
 async function load(){
  setBusy(true);setError("");
  try{
   const response=await fetch("/api/placements/tpo/announcements/"+encodeURIComponent(id)+"/receipts",{
    cache:"no-store",credentials:"same-origin",
   });
   if(!response.ok)throw new Error("Couldn't load read status");
   setData(await response.json() as Summary);
  }catch(e){setError(e instanceof Error?e.message:"Couldn't load read status");}
  finally{setBusy(false);}
 }
 return <section className="mt-3 rounded-lg border border-border bg-surface-secondary p-3">
  <button type="button" className="min-h-10 text-sm font-semibold text-primary-text underline"
   disabled={busy} onClick={()=>void load()}>{busy?"Loading…":data?"Refresh read status":"Show read status"}</button>
  {data?<div className="mt-2 space-y-2 text-sm">
   <p>{data.notDelivered?"Awaiting notification delivery":data.read+" of "+data.delivered+" read"}</p>
   {data.delivered>0?<progress aria-label="Notices read" max={data.delivered} value={data.read} className="w-full"/>:null}
   {data.unread.length?<button type="button" disabled={busy} className="min-h-10 rounded border border-border px-3 text-primary-text"
    onClick={async()=>{
     setBusy(true);setError("");setReminder("");
     try{
      const response=await fetch("/api/placements/tpo/announcements/"+encodeURIComponent(id)+"/remind",{
       method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},
      });
      const payload=await response.json() as {reminded?:number;error?:string};
      if(!response.ok)throw new Error(response.status===429?"Reminders can be sent once per hour.":
       payload.error==="NOTICE_NOT_DELIVERED"?"This notice hasn't been delivered yet.":
       "Could not send a reminder.");
      setReminder("Reminder sent to "+(payload.reminded??0)+" unread people.");
     }catch(e){setError(e instanceof Error?e.message:"Could not send a reminder.");}
     finally{setBusy(false);}
    }}>Remind them</button>:null}
   {reminder?<p role="status">{reminder}</p>:null}
   {data.unread.length?<details><summary className="cursor-pointer text-primary-text">Who hasn't read</summary>
    <ul className="max-h-48 overflow-auto">{data.unread.map((name,index)=>
     <li key={index} className="py-0.5">{name}</li>)}</ul>
   </details>:null}
  </div>:null}
  {error?<p role="alert" className="mt-2 text-sm">{error}</p>:null}
 </section>;
}

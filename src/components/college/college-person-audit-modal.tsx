"use client";
import {useState} from "react";
type Event={id:string;summary:string;kind:string;at:string;importance:string;authorId:string|null};
export function CollegePersonAuditModal({membershipId,name,kind}:{membershipId:string;name:string;kind:"FACULTY"|"LEARNER"}){
 const [open,setOpen]=useState(false),[busy,setBusy]=useState(false);
 const [events,setEvents]=useState<Event[]>([]),[error,setError]=useState(""),[truncated,setTruncated]=useState(false);
 async function show(){
  setOpen(true);setBusy(true);setError("");
  try{const r=await fetch("/api/college/people/"+encodeURIComponent(membershipId)+"/audit?kind="+kind,{
   cache:"no-store"});
   const body=await r.json().catch(()=>null);
   if(!r.ok||!body?.person)throw Error(body?.error??"Could not load audit trail");
   setEvents(body.events??[]);setTruncated(body.truncated===true);
  }catch(e){setError(e instanceof Error?e.message:"Could not load audit trail");}
  finally{setBusy(false);}
 }
 const date=new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"});
 return <>
  <button type="button" onClick={()=>void show()}
   className="min-h-9 rounded border border-border px-3 text-xs font-semibold text-primary-text">Audit trail</button>
  {open?<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
   <section role="dialog" aria-modal="true" aria-label={"Audit trail for "+name}
    className="w-full max-w-2xl space-y-3 rounded-xl bg-surface p-5">
    <div className="flex items-center justify-between">
     <h2 className="font-semibold">Audit trail · {name}</h2>
     <button type="button" className="min-h-10 rounded border border-border px-3"
      onClick={()=>setOpen(false)}>Close</button>
    </div>
    {busy?<p role="status">Loading audit trail…</p>:null}
    {error?<p role="alert" className="text-error">{error}</p>:null}
    {!events.length&&!busy&&!error?<p className="text-sm text-muted-foreground">No recorded activity for this person.</p>:null}
    <ol className="max-h-96 space-y-3 overflow-auto">
     {events.map(event=><li key={event.id} className="rounded border border-border p-3 text-sm">
      <strong>{event.summary}</strong>
      <p className="mt-1 text-xs text-muted-foreground">{date.format(new Date(event.at))} IST · {event.importance}</p>
      <p className="mt-1 break-all text-xs text-muted-foreground">{event.kind}</p>
     </li>)}
    </ol>
    {truncated?<p className="text-xs text-muted-foreground">Showing 100 most recent events.</p>:null}
   </section>
  </div>:null}
 </>;
}

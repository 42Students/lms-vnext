"use client";
import { Button } from "@/components/ui/button";
import {Dialog} from "@/components/ui/dialog";
import {useState} from "react";
type Event={id:string;summary:string;kind:string;at:string;importance:string;authorId:string|null;authorName:string|null};
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
  <Button variant="secondary" type="button" onClick={()=>void show()}
   className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius,9px)] border border-border px-3 text-xs font-semibold text-primary-text">Audit trail</Button>
  <Dialog open={open} onOpenChange={setOpen} title={"Audit trail for "+name}>
    <div className="flex items-center justify-between">
     <h2 className="font-semibold">Audit trail · {name}</h2>
     <Button variant="secondary" type="button" className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius,9px)] border border-border px-3"
      onClick={()=>setOpen(false)}>Close</Button>
    </div>
    {busy?<p role="status">Loading audit trail…</p>:null}
    {error?<p role="alert" className="text-error">{error}</p>:null}
    {!events.length&&!busy&&!error?<p className="text-sm text-muted-foreground">No recorded activity for this person.</p>:null}
    <ol className="space-y-3">
     {events.map(event=><li key={event.id} className="rounded-[var(--lms-control-radius,9px)] border border-border p-3 text-sm">
      <strong>{event.summary}</strong>
      <p className="mt-1 text-xs text-muted-foreground">{date.format(new Date(event.at))} IST · {event.importance} · By {event.authorName??"System/unknown staff"}</p>
      <p className="mt-1 break-all text-xs text-muted-foreground">{event.kind}</p>
     </li>)}
    </ol>
    {truncated?<p className="text-xs text-muted-foreground">Showing 100 most recent events.</p>:null}
  </Dialog>
 </>;
}

"use client";
import { Button } from "@/components/ui/button";
import {Dialog} from "@/components/ui/dialog";
import {Alert} from "@/components/ui/alert";
import {EmptyState} from "@/components/ui/empty-state";
import {Skeleton} from "@/components/ui/skeleton";
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
   className="min-h-11 md:min-h-9">Audit trail</Button>
  <Dialog open={open} onOpenChange={setOpen} title={"Audit trail for "+name}>
    <div className="flex justify-end">
     <Button variant="secondary" type="button" className="min-h-11 md:min-h-9"
      onClick={()=>setOpen(false)}>Close</Button>
    </div>
    {busy?<Skeleton variant="row" count={3} label="Loading audit trail"/>:null}
    {error?<Alert tone="error">{error}</Alert>:null}
    {!events.length&&!busy&&!error?<EmptyState title="No recorded activity" description="No recorded activity for this person."/>:null}
    <ol className="divide-y divide-border">
     {events.map(event=><li key={event.id} className="py-3 text-sm">
      <strong>{event.summary}</strong>
      <p className="mt-1 text-xs text-muted-foreground">{date.format(new Date(event.at))} IST · {event.importance} · By {event.authorName??"System/unknown staff"}</p>
      <p className="mt-1 break-all text-xs text-muted-foreground">{event.kind}</p>
     </li>)}
    </ol>
    {truncated?<Alert tone="info">Showing 100 most recent events.</Alert>:null}
  </Dialog>
 </>;
}

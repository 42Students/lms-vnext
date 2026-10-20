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
  setOpen(true);setBusy(true);setError("");setEvents([]);setTruncated(false);
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
   className="min-h-11 w-full md:min-h-9 md:w-auto">Audit trail</Button>
  <Dialog open={open} onOpenChange={setOpen} title={"Audit trail for "+name} footer={<Button variant="secondary" type="button" className="min-h-11 w-full md:min-h-9 md:w-auto"
      onClick={()=>setOpen(false)}>Close</Button>}>
    
    {busy?<Skeleton variant="row" count={3} label="Loading audit trail"/>:null}
    {error?<Alert tone="error">{error}</Alert>:null}
    {!events.length&&!busy&&!error?<EmptyState title="No recorded activity" description="No recorded activity for this person."/>:null}
    {!busy&&!error&&events.length>0?<ol className="min-w-0 divide-y divide-border border-y border-border">
     {events.map(event=><li key={event.id} className="min-w-0 space-y-[var(--lms-space-1)] py-[var(--lms-space-3)] text-sm">
      <strong className="block break-words font-semibold text-foreground">{event.summary}</strong>
      <p className="break-words text-xs text-muted-foreground">{date.format(new Date(event.at))} IST · {event.importance} · By {event.authorName??"System/unknown staff"}</p>
      <p className="break-words text-xs text-muted-foreground">{event.kind}</p>
     </li>)}
    </ol>:null}
    {!busy&&!error&&truncated?<Alert tone="info">Showing 100 most recent events.</Alert>:null}
  </Dialog>
 </>;
}

"use client";
import {useState} from "react";
function currentTimeMs(){return Date.now();}
type Event={id:string;eventType:string;importance:string;summary:string;actorDisplayName:string|null;occurredAt:Date};
export function ProjectActivityFilteredList({events}:{events:Event[]}){
 const [type,setType]=useState(""),[range,setRange]=useState("ALL");
 const kinds=[...new Set(events.map(event=>event.eventType))].sort();
 const filtered=events.filter(event=>{
  const age=currentTimeMs()-new Date(event.occurredAt).getTime();
  return (!type||event.eventType===type)&&
    (range==="ALL"||age<Number(range)*86400000);
 });
 return <section className="space-y-3">
  <div className="flex flex-wrap gap-3 rounded-lg border border-border p-3">
   <label className="text-sm font-semibold">Type
    <select value={type} onChange={e=>setType(e.target.value)}
     className="ml-2 min-h-10 rounded border border-border bg-background p-2">
     <option value="">All activity</option>{kinds.map(k=><option key={k} value={k}>{k.split(".").slice(1).join(" ")}</option>)}
    </select></label>
   <label className="text-sm font-semibold">Date range
    <select value={range} onChange={e=>setRange(e.target.value)}
     className="ml-2 min-h-10 rounded border border-border bg-background p-2">
     <option value="ALL">All time</option><option value="1">Today</option>
     <option value="7">Last 7 days</option><option value="30">Last 30 days</option>
    </select></label>
   <button type="button" className="min-h-10 text-sm font-semibold text-primary-text underline"
    onClick={()=>{setType("");setRange("ALL")}}>Clear filters</button>
  </div>
  <p className="text-xs text-muted-foreground">{filtered.length} events · Times shown in your device timezone.</p>
  {!filtered.length?<p className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
    No activity matches these filters.
  </p>:<div className="space-y-2">{filtered.map(event=><article key={event.id}
    className="rounded-xl border border-border bg-surface p-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
     <div><p className="font-semibold">{event.summary}</p>
      <p className="mt-1 text-xs text-muted-foreground">
       {event.actorDisplayName??"System"} ·
       {" "+new Date(event.occurredAt).toLocaleString(undefined,{dateStyle:"medium",timeStyle:"short"})}
      </p>
     </div><span className="rounded-md border border-border px-2 py-1 text-xs">{event.eventType.split(".").slice(1).join(" ")}</span>
    </div>
   </article>)}</div>}
 </section>;
}

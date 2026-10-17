"use client";
import {useState} from "react";
import {mentorActivityCategory, mentorActivityLabel, mentorActivityRelativeTime} from "@/modules/projects/mentor-activity-display-model";

type Event={id:string;eventType:string;importance:string;summary:string;actorDisplayName:string|null;occurredAt:Date};

export function ProjectActivityFilteredList({events,now}:{events:Event[];now:string}){
 const [type,setType]=useState("");
 const [range,setRange]=useState("ALL");
 const [fromDate,setFromDate]=useState("");
 const [toDate,setToDate]=useState("");
 const categories=[...new Set(events.map(event=>event.eventType))].sort();
 const current=Date.parse(now);
 const filtered=events.filter(event=>{
  const occurred=new Date(event.occurredAt);
  const day=occurred.toISOString().slice(0,10);
  return (!type||event.eventType===type)
    &&(range==="ALL"||current-occurred.getTime()<Number(range)*86400000)
    &&(!fromDate||day>=fromDate)
    &&(!toDate||day<=toDate);
 });
 const resetFilters=()=>{setType("");setRange("ALL");setFromDate("");setToDate("");};
 return <section className="space-y-3">
  <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border p-3">
   <label className="grid gap-1 text-sm font-semibold">Type
    <select value={type} onChange={event=>setType(event.target.value)}
      className="min-h-10 rounded border border-border bg-background p-2">
     <option value="">All activity</option>
     {categories.map(kind=><option key={kind} value={kind}>{mentorActivityLabel(kind)}</option>)}
    </select>
   </label>
   <label className="grid gap-1 text-sm font-semibold">Date range
    <select value={range} onChange={event=>setRange(event.target.value)}
      className="min-h-10 rounded border border-border bg-background p-2">
     <option value="ALL">All time</option><option value="1">Today</option>
     <option value="7">Last 7 days</option><option value="30">Last 30 days</option>
    </select>
   </label>
   <label className="grid gap-1 text-sm font-semibold">From date
    <input type="date" value={fromDate} max={toDate||now.slice(0,10)}
      onChange={event=>setFromDate(event.target.value)}
      className="min-h-10 rounded border border-border bg-background px-2"/>
   </label>
   <label className="grid gap-1 text-sm font-semibold">To date
    <input type="date" value={toDate} min={fromDate||undefined} max={now.slice(0,10)}
      onChange={event=>setToDate(event.target.value)}
      className="min-h-10 rounded border border-border bg-background px-2"/>
   </label>
   <button type="button" onClick={resetFilters}
      className="min-h-10 text-sm font-semibold text-primary-text underline">Clear filters</button>
  </div>
  <p className="text-xs text-muted-foreground">{filtered.length} events · Times shown in your device timezone.</p>
  {!filtered.length
    ? <p className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
      {events.length===0
       ? "No project activity yet. Task moves, sprint updates and resource changes will appear here."
       : type && (fromDate||toDate||range!=="ALL")
        ? "No activity matches this source and date range."
        : fromDate||toDate||range!=="ALL" ? "No activity in this date range."
        : "No activity recorded from this source yet."}
    </p>
    : <div role="feed" aria-label="Project activity" className="space-y-2">
      {filtered.map(event=><article key={event.id} className="rounded-xl border border-border bg-surface p-4">
       <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
         <p className="font-semibold">{event.summary}</p>
         <p className="mt-1 text-xs text-muted-foreground">
           {event.actorDisplayName??"System"} ·{" "}
           <time dateTime={new Date(event.occurredAt).toISOString()}
             title={new Date(event.occurredAt).toLocaleString(undefined,{dateStyle:"full",timeStyle:"long"})}>
             {mentorActivityRelativeTime(event.occurredAt,now)}
           </time>
         </p>
        </div>
        <div className="flex flex-wrap gap-2">
         <span className="rounded-md border border-border px-2 py-1 text-xs">{mentorActivityLabel(event.eventType)}</span>
         <span className="rounded-md border border-border px-2 py-1 text-xs">{mentorActivityCategory(event.eventType)}</span>
        </div>
       </div>
      </article>)}
     </div>}
 </section>;
}

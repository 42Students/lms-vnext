"use client";
import {useState,useRef} from "react";
import {apiFetch} from "@/lib/api-fetch";
import {mentorActivityCategory, mentorActivityLabel, mentorActivityRelativeTime} from "@/modules/projects/mentor-activity-display-model";

type Event={id:string;eventType:string;importance:string;summary:string;actorDisplayName:string|null;occurredAt:string|Date};
type Cursor={time:string;id:string};
type Page={events:Event[];hasMore:boolean;nextCursor:Cursor|null};

export function ProjectActivityFilteredList({projectId,events,now}:{
 projectId:string;events:Event[];now:string;
}){
 const [items,setItems]=useState<readonly Event[]>(events);
 const [hasMore,setHasMore]=useState(events.length>=100);
 const [cursor,setCursor]=useState<Cursor|null>(null);
 const [busy,setBusy]=useState(false);
 const [loadError,setLoadError]=useState("");
 const lock=useRef(false);
 async function loadMore(){
  if(lock.current||!hasMore)return;
  lock.current=true;setBusy(true);setLoadError("");
  try{
    const endpoint="/api/projects/"+encodeURIComponent(projectId)+"/activity";
    // The first request obtains the precise microsecond cursor so same-ms
    // events are not skipped by Date's millisecond precision.
    let next=cursor;
    if(!next){
      const first=await apiFetch<Page>(endpoint,{cache:"no-store"});
      next=first.nextCursor;
      if(!next){setHasMore(false);return;}
    }
    const params=new URLSearchParams({beforeTime:next.time,beforeId:next.id});
    const page=await apiFetch<Page>(endpoint+"?"+params.toString(),{cache:"no-store"});
    setItems(previous=>{
      const seen=new Set(previous.map(event=>event.id));
      return [...previous,...page.events.filter(event=>!seen.has(event.id))];
    });
    setCursor(page.nextCursor);
    setHasMore(page.hasMore);
  }catch{setLoadError("We couldn't load more activity. Try again.");}
  finally{lock.current=false;setBusy(false);}
 }
 const [type,setType]=useState("");
 const [range,setRange]=useState("ALL");
 const [fromDate,setFromDate]=useState("");
 const [toDate,setToDate]=useState("");
 const categories=[...new Set(items.map(event=>event.eventType))].sort();
 const current=Date.parse(now);
 const filtered=items.filter(event=>{
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
      {items.length===0
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
  {hasMore?<button type="button" disabled={busy} onClick={()=>void loadMore()}
   className="min-h-10 rounded-md border border-border px-4 text-sm font-semibold text-primary-text disabled:opacity-50">
   {busy?"Loading activity…":"Load more activity"}
  </button>:null}
  {loadError?<p role="alert" className="text-sm text-error">{loadError}</p>:null}
 </section>;
}

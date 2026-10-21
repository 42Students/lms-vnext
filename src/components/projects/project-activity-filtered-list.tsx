"use client";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import {useState,useRef} from "react";
import {apiFetch} from "@/lib/api-fetch";
import {mentorActivityCategory, mentorActivityLabel, mentorActivityRelativeTime} from "@/modules/projects/mentor-activity-display-model";
import {projectResourceAuditMatches} from "@/modules/projects/project-resource-audit-model";

type Event={id:string;eventType:string;importance:string;summary:string;actorDisplayName:string|null;occurredAt:string|Date;subjectLabel?:string|null;subjectId?:string|null;actorType?:string|null};
type Cursor={time:string;id:string};
type Page={events:Event[];hasMore:boolean;nextCursor:Cursor|null};

export function ProjectActivityFilteredList({projectId,events,now,resourceAudit=false}:{
 projectId:string;events:Event[];now:string;resourceAudit?:boolean;
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
 const [search,setSearch]=useState("");
 const [resourceAction,setResourceAction]=useState("ALL");
 const [type,setType]=useState("");
 const [range,setRange]=useState("ALL");
 const [fromDate,setFromDate]=useState("");
 const [toDate,setToDate]=useState("");
 const categories=[...new Set(items.map(event=>event.eventType))].sort();
 const current=Date.parse(now);
 const filtered=items.filter(event=>{
  const occurred=new Date(event.occurredAt);
  const day=occurred.toISOString().slice(0,10);
  const term=search.trim().toLocaleLowerCase("en-IN");
  return (!term||[event.summary,event.actorDisplayName??"",event.eventType].some(value=>value.toLocaleLowerCase("en-IN").includes(term)))
    &&projectResourceAuditMatches(event.eventType,resourceAction)
    &&(!type||event.eventType===type)
    &&(range==="ALL"||current-occurred.getTime()<Number(range)*86400000)
    &&(!fromDate||day>=fromDate)
    &&(!toDate||day<=toDate);
 });
 const resetFilters=()=>{setSearch("");setResourceAction("ALL");setType("");setRange("ALL");setFromDate("");setToDate("");};
 return <section className="space-y-3">
  <div className="flex flex-wrap items-end gap-3 border-b border-border pb-4">
   <label className="grid gap-[6px] text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">Search activity
    <Input type="search" value={search} onChange={event=>setSearch(event.target.value)}
     placeholder="Search activity" className="w-full"/>
   </label>
   {resourceAudit?<label className="grid gap-[6px] text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">Resource change
    <Select value={resourceAction} onChange={event=>setResourceAction(event.target.value)}
     className="w-full">
     <option value="ALL">All resource changes</option>
     {(["Added","Edited","Saved","Removed"] as const).map(action=><option key={action} value={action}>{action}</option>)}
    </Select>
   </label>:null}
   <label className="grid gap-[6px] text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">Type
    <Select value={type} onChange={event=>setType(event.target.value)}
      className="w-full">
     <option value="">All activity</option>
     {categories.map(kind=><option key={kind} value={kind}>{mentorActivityLabel(kind)}</option>)}
    </Select>
   </label>
   <label className="grid gap-[6px] text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">Date range
    <Select value={range} onChange={event=>setRange(event.target.value)}
      className="w-full">
     <option value="ALL">All time</option><option value="1">Today</option>
     <option value="7">Last 7 days</option><option value="30">Last 30 days</option>
    </Select>
   </label>
   <label className="grid gap-[6px] text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">From date
    <Input type="date" value={fromDate} max={toDate||now.slice(0,10)}
      onChange={event=>setFromDate(event.target.value)}
      className="w-full"/>
   </label>
   <label className="grid gap-[6px] text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">To date
    <Input type="date" value={toDate} min={fromDate||undefined} max={now.slice(0,10)}
      onChange={event=>setToDate(event.target.value)}
      className="w-full"/>
   </label>
   <Button variant="secondary" type="button" onClick={resetFilters}
      className="">Clear filters</Button>
  </div>
  <p className="text-xs text-muted-foreground">{filtered.length} events · Times shown in your device timezone.</p>
  {!filtered.length
    ? <EmptyState title={resourceAudit?(items.length===0?"No resource changes yet":"No resource changes match these filters"):(items.length===0?"No project activity yet":"No matching activity")}
      description={items.length===0
        ? "Task moves, sprint updates and resource changes will appear here."
        : (type||search||resourceAction!=="ALL") && (fromDate||toDate||range!=="ALL")
          ? "No activity matches this source and date range."
          : search||resourceAction!=="ALL" ? "No activity matches these resource or search filters."
          : fromDate||toDate||range!=="ALL" ? "No activity in this date range."
          : "No activity recorded from this source yet."} />
    : resourceAudit ? <div className="min-w-0 overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <caption className="sr-only">Workspace resource audit</caption>
        <thead><tr className="border-b border-border">
          <th scope="col" className="p-2">Resource</th><th scope="col" className="p-2">Action</th>
          <th scope="col" className="p-2">Actor</th><th scope="col" className="p-2">When</th>
        </tr></thead>
        <tbody>{filtered.map(event=><tr key={event.id} className="border-b border-border">
          <td className="p-2 break-words">{event.subjectLabel??event.summary}</td>
          <td className="p-2">{mentorActivityLabel(event.eventType)}</td>
          <td className="p-2">{event.actorDisplayName??event.actorType??"System"}</td>
          <td className="p-2"><time dateTime={new Date(event.occurredAt).toISOString()}>
            {new Date(event.occurredAt).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})} IST
          </time></td>
        </tr>)}</tbody>
      </table>
    </div>
    : <div role="feed" aria-label="Project activity" className="space-y-2">
      {filtered.map(event=><article key={event.id} className="border-b border-border py-4">
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
         <StatusBadge tone="neutral">{mentorActivityLabel(event.eventType)}</StatusBadge>
         <StatusBadge tone="neutral">{mentorActivityCategory(event.eventType)}</StatusBadge>
        </div>
       </div>
      </article>)}
     </div>}
  {hasMore?<Button variant="secondary" type="button" disabled={busy} onClick={()=>void loadMore()}
   className="">
   {busy?"Loading activity…":"Load more activity"}
  </Button>:null}
  {loadError?<p role="alert" className="text-sm text-error">{loadError}</p>:null}
 </section>;
}

"use client";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import {Fragment,useEffect,useState,useRef} from "react";
import {apiFetch} from "@/lib/api-fetch";
import {mentorActivityCategory, mentorActivityLabel, mentorActivityRelativeTime} from "@/modules/projects/mentor-activity-display-model";
import {projectResourceAuditAction,projectResourceAuditMatches} from "@/modules/projects/project-resource-audit-model";
import {mentorLoadedWeekActivitySummary} from "@/modules/projects/mentor-week-activity-summary-model";
import {mentorFewestRecordedContributors} from "@/modules/projects/mentor-week-contributor-model";

type Event={id:string;eventType:string;importance:string;summary:string;actorDisplayName:string|null;occurredAt:string|Date;subjectLabel?:string|null;subjectId?:string|null;actorType?:string|null;actorUserId?:string|null;resourceKey?:string|null;sprintId?:string|null};
const PAGE_SIZE = 10;

function resourceLabel(value:string|null|undefined):string {
  if (!value) return "—";
  return value.replace(/^resource-/i,"").replace(/-/g," ").replace(/^./,letter=>letter.toUpperCase());
}
function actorTypeLabel(value:string|null|undefined):string {
  const normalized=(value??"").toUpperCase();
  return ({FACULTY:"Staff",LEARNER:"Student",ADMIN:"Admin"} as Record<string,string>)[normalized] ?? (value||"—");
}
function resourceActionLabel(eventType:string):string {
  return projectResourceAuditAction(eventType)??mentorActivityLabel(eventType);
}
const eventIstDay=(value:string|Date)=>{
 const stamp=new Date(value);
 return Number.isFinite(stamp.getTime())
   ?new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",
     weekday:"long",day:"numeric",month:"long",year:"numeric"}).format(stamp)
   :"Date unavailable";
};
type Cursor={time:string;id:string};
type Page={events:Event[];hasMore:boolean;nextCursor:Cursor|null};

export function ProjectActivityFilteredList({projectId,events,now,resourceAudit=false,sprints=[],mentorWeekSummary=false,weekContributors=[],actorOptions=[]}:{
 projectId:string;events:Event[];now:string;resourceAudit?:boolean;
 sprints?:readonly {id:string;title:string;sequence:number}[];
 mentorWeekSummary?:boolean;
 weekContributors?:readonly {membershipId:string;name:string;eventCount:number}[];
 actorOptions?:readonly {id:string;label:string}[];
}){
 const [items,setItems]=useState<readonly Event[]>(events);
 const [hasMore,setHasMore]=useState(events.length>=100);
 const [cursor,setCursor]=useState<Cursor|null>(null);
 const [busy,setBusy]=useState(false);
 const [loadError,setLoadError]=useState("");
 const lock=useRef(false);
 const generation=useRef(0);
 const actorGeneration=useRef(0);
 const [actorFeed,setActorFeed]=useState<{
   id:string;events:Event[];hasMore:boolean;nextCursor:Cursor|null;
 }|null>(null);
 const [actorBusy,setActorBusy]=useState(false);
 const [actorError,setActorError]=useState("");
 const [page,setPage]=useState(1);
 useEffect(()=>{
  generation.current+=1;
  setItems(events);setHasMore(events.length>=100);setCursor(null);setBusy(false);setLoadError("");setPage(1);
  return ()=>{generation.current+=1;};
 },[projectId,events]);
 async function loadMore(){
  if(actor){
   if(lock.current||!actorFeed?.hasMore||!actorFeed.nextCursor)return;
   lock.current=true;setBusy(true);setLoadError("");
   const generationNow=actorGeneration.current;
   const query=new URLSearchParams({actorUserId:actor,
     beforeTime:actorFeed.nextCursor.time,beforeId:actorFeed.nextCursor.id});
   try{
    const page=await apiFetch<Page>("/api/projects/"+
      encodeURIComponent(projectId)+"/activity?"+query.toString(),
      {cache:"no-store"});
    if(generationNow!==actorGeneration.current)return;
    setActorFeed(previous=>{
      if(!previous||previous.id!==actor)return previous;
      const seen=new Set(previous.events.map(event=>event.id));
      return {id:actor,events:[...previous.events,
        ...page.events.filter(event=>!seen.has(event.id))],
        hasMore:page.hasMore,nextCursor:page.nextCursor};
    });
   }catch{
    if(generationNow===actorGeneration.current)
      setLoadError("Could not load older events by this person. Retry.");
   }finally{lock.current=false;
      if(generationNow===actorGeneration.current)setBusy(false);
   }
   return;
  }
  if(lock.current||!hasMore)return;
  lock.current=true;setBusy(true);setLoadError("");
  const requestGeneration=generation.current;
  try{
    const endpoint="/api/projects/"+encodeURIComponent(projectId)+"/activity";
    // The first request obtains the precise microsecond cursor so same-ms
    // events are not skipped by Date's millisecond precision.
    let next=cursor;
    if(!next){
      const first=await apiFetch<Page>(endpoint,{cache:"no-store"});
      next=first.nextCursor;
      if(!next){if(requestGeneration===generation.current)setHasMore(false);return;}
    }
    const params=new URLSearchParams({beforeTime:next.time,beforeId:next.id});
    const page=await apiFetch<Page>(endpoint+"?"+params.toString(),{cache:"no-store"});
    if(requestGeneration!==generation.current)return;
    setItems(previous=>{
      const seen=new Set(previous.map(event=>event.id));
      return [...previous,...page.events.filter(event=>!seen.has(event.id))];
    });
    setCursor(page.nextCursor);
    setHasMore(page.hasMore);
  }catch{if(requestGeneration===generation.current)setLoadError("We couldn't load more activity. Try again.");}
  finally{lock.current=false;if(requestGeneration===generation.current)setBusy(false);}
 }
 const [search,setSearch]=useState("");
 const [resourceAction,setResourceAction]=useState("ALL");
 const [type,setType]=useState("");
 const [actor,setActor]=useState("");
 const [sprint,setSprint]=useState("");
 const [range,setRange]=useState("ALL");
 const [fromDate,setFromDate]=useState("");
 const [toDate,setToDate]=useState("");
 const categories=[...new Set(items.map(event=>event.eventType))].sort();
 const actors=[...new Map([
    ...items.filter(event=>Boolean(event.actorUserId)).map(event=>
      ({id:event.actorUserId!,label:event.actorDisplayName??"Recorded actor"})),
    ...actorOptions,
   ].map(row=>[row.id,row] as const)).values()]
   .sort((a,b)=>a.label.localeCompare(b.label)||a.id.localeCompare(b.id));
 async function selectActor(id:string){
   actorGeneration.current+=1;
   const generationNow=actorGeneration.current;
   setActor(id);setPage(1);setActorFeed(null);setActorError("");
   if(!id)return;
   setActorBusy(true);
   try{
     const query=new URLSearchParams({actorUserId:id});
     const page=await apiFetch<Page>("/api/projects/"+
       encodeURIComponent(projectId)+"/activity?"+query.toString(),
       {cache:"no-store"});
     if(generationNow!==actorGeneration.current)return;
     setActorFeed({id,events:page.events,hasMore:page.hasMore,
       nextCursor:page.nextCursor});
   }catch{
     if(generationNow===actorGeneration.current)
       setActorError("Could not load that person's complete recorded history. Retry the selection.");
   }finally{
     if(generationNow===actorGeneration.current)setActorBusy(false);
   }
 }
 const working=actor?(actorFeed?.id===actor?actorFeed.events:[]):items;
 const activeHasMore=actor?(actorFeed?.id===actor?actorFeed.hasMore:false):hasMore;
 const current=Date.parse(now);
 const filtered=working.filter(event=>{
  const occurred=new Date(event.occurredAt);
  const day=occurred.toISOString().slice(0,10);
  const term=search.trim().toLocaleLowerCase("en-IN");
  return (!resourceAudit||projectResourceAuditAction(event.eventType)!==null)
    &&(!term||[event.summary,event.actorDisplayName??"",event.actorUserId??"",event.actorType??"",actorTypeLabel(event.actorType),event.eventType,event.subjectLabel??"",event.subjectId??"",event.resourceKey??"",resourceLabel(event.resourceKey??event.subjectLabel),resourceActionLabel(event.eventType)].some(value=>value.toLocaleLowerCase("en-IN").includes(term)))
    &&projectResourceAuditMatches(event.eventType,resourceAction)
    &&(!type||event.eventType===type)
    &&(!actor||(event.actorUserId??event.actorDisplayName)===actor)
     &&(!sprint||event.sprintId===sprint)
    &&(range==="ALL"||current-occurred.getTime()<Number(range)*86400000)
    &&(!fromDate||day>=fromDate)
    &&(!toDate||day<=toDate);
 });
 const week=mentorWeekSummary?mentorLoadedWeekActivitySummary(items,new Date(now)):null;
 const fewest=mentorWeekSummary?mentorFewestRecordedContributors(weekContributors):null;
 const resourceEvents=items.filter(item=>projectResourceAuditAction(item.eventType)!==null);
 const counts=[
  ["Changes",resourceEvents.length],
  ["Added",resourceEvents.filter(item=>projectResourceAuditAction(item.eventType)==="Added").length],
  ["Edited",resourceEvents.filter(item=>["Edited","Saved"].includes(projectResourceAuditAction(item.eventType)??"")).length],
  ["Removed",resourceEvents.filter(item=>projectResourceAuditAction(item.eventType)==="Removed").length],
 ] as const;
 const totalPages=Math.max(1,Math.ceil(filtered.length/PAGE_SIZE));
 const activePage=Math.min(page,totalPages);
 const paged=resourceAudit?filtered.slice((activePage-1)*PAGE_SIZE,activePage*PAGE_SIZE):filtered;
 const resetFilters=()=>{
   actorGeneration.current+=1;setActorFeed(null);setActor("");setActorError("");
   setSearch("");setResourceAction("ALL");setType("");setSprint("");
   setRange("ALL");setFromDate("");setToDate("");setPage(1);
 };
 return <section className="space-y-3">
  {week?<div aria-label="This week in project activity"
    className="space-y-1 rounded-lg border border-border p-3">
    <strong>This week · recorded in loaded activity</strong>
    <p>{week.taskMoves} task moves · {week.comments} comments ·
      {" "}{week.resourcesShared} shared resources · {week.count} total events</p>
    <p className="text-xs text-muted-foreground">
      This is a summary of loaded history, not a complete project-wide count.
      Task, comment and resource totals shown above use the loaded activity page.
      The following learner comparison uses all recorded events in the authorized
      current IST week, including events outside the loaded page.
    </p>
    {fewest?.kind==="RESULT"?<p>
      Fewest recorded project events among active students:
      {" "}{fewest.members.map(member=>member.name).join(", ")}
      {" "}({fewest.count} recorded {fewest.count===1?"event":"events"}).
      {fewest.members.length>1?" Tied at the lowest count.":""}
      This is not a measure of attendance, activity outside this project
      or a student's contribution quality.
    </p>:<p>Student activity comparison requires at least two currently
      assigned learners with valid recorded event counts.</p>}
   </div>:null}
  {resourceAudit?<div aria-label="Resource activity totals" className="grid grid-cols-2 gap-2 sm:grid-cols-4">{counts.map(([label,value])=><div key={label} className="rounded-lg border border-border p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="text-xl font-semibold tabular-nums">{value}</p></div>)}</div>:null}
  <div className="flex flex-wrap items-end gap-3 border-b border-border pb-4">
   <label className="grid gap-[6px] text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">Search {resourceAudit?"resource or actor":"activity"}
    <Input type="search" value={search} onChange={event=>{setSearch(event.target.value);setPage(1);}}
     placeholder={resourceAudit?"Search resource or actor":"Search activity"} className="w-full"/>
   </label>
   {resourceAudit?<label className="grid gap-[6px] text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">Resource change
    <Select value={resourceAction} onChange={event=>{setResourceAction(event.target.value);setPage(1);}}
     className="w-full">
     <option value="ALL">All resource changes</option>
     {(["Added","Edited","Saved","Removed"] as const).map(action=><option key={action} value={action}>{action}</option>)}
    </Select>
   </label>:null}
   <label className="grid gap-[6px] text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">Type
    <Select value={type} onChange={event=>{setType(event.target.value);setPage(1);}}
      className="w-full">
     <option value="">All activity</option>
     {categories.map(kind=><option key={kind} value={kind}>{mentorActivityLabel(kind)}</option>)}
    </Select>
   </label>
   {!resourceAudit?<label className="grid gap-[6px] text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">By person
     <Select value={actor} onChange={event=>void selectActor(event.target.value)}
       className="w-full">
       <option value="">By anyone</option>
       {actors.map(person=><option key={person.id} value={person.id}>{person.label}</option>)}
     </Select>
   </label>:null}
   {!resourceAudit&&sprints.length>0?<label className="grid gap-[6px] text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">
      In sprint
      <Select value={sprint} onChange={event=>{setSprint(event.target.value);setPage(1);}}
        className="w-full">
        <option value="">Any sprint</option>
        {[...sprints].sort((a,b)=>a.sequence-b.sequence).map(item=>
          <option key={item.id} value={item.id}>Sprint {item.sequence} · {item.title}</option>)}
      </Select>
    </label>:null}
    <label className="grid gap-[6px] text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">Date range
    <Select value={range} onChange={event=>{setRange(event.target.value);setPage(1);}}
      className="w-full">
     <option value="ALL">All time</option><option value="1">Today</option>
     <option value="7">Last 7 days</option><option value="30">Last 30 days</option>
    </Select>
   </label>
   <label className="grid gap-[6px] text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">From date
    <Input type="date" value={fromDate} max={toDate||now.slice(0,10)}
      onChange={event=>{setFromDate(event.target.value);setPage(1);}}
      className="w-full"/>
   </label>
   <label className="grid gap-[6px] text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">To date
    <Input type="date" value={toDate} min={fromDate||undefined} max={now.slice(0,10)}
      onChange={event=>{setToDate(event.target.value);setPage(1);}}
      className="w-full"/>
   </label>
   <Button variant="secondary" type="button" onClick={resetFilters}
      className="">Clear filters</Button>
  </div>
  {actorBusy?<p role="status">Loading complete recorded activity for the selected person…</p>:null}
  {actorError?<p role="alert">{actorError}</p>:null}
  <p className="text-xs text-muted-foreground">{resourceAudit
    ? filtered.length===0?"0 matching changes":`${(activePage-1)*PAGE_SIZE+1}–${Math.min(activePage*PAGE_SIZE,filtered.length)} of ${filtered.length} matching changes`
    :`${filtered.length} events`} · Times shown in IST.{sprint?" Events without a recorded sprint ID are excluded.":""}{activeHasMore?" Load more to include older events.":""}</p>
  {!filtered.length
    ? <EmptyState title={resourceAudit?(items.length===0?"No resource changes yet":"No resource changes match these filters"):(items.length===0?"No project activity yet":"No matching activity")}
      description={items.length===0
        ? "Task moves, sprint updates and resource changes will appear here."
        : (type||search||sprint||resourceAction!=="ALL") && (fromDate||toDate||range!=="ALL")
          ? "No activity matches this source and date range."
          : search||sprint||resourceAction!=="ALL" ? "No activity matches these activity filters."
          : fromDate||toDate||range!=="ALL" ? "No activity in this date range."
          : "No activity recorded from this source yet."} />
    : resourceAudit ? <div className="min-w-0 overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <caption className="sr-only">Workspace resource audit</caption>
        <thead><tr className="border-b border-border">
          <th scope="col" className="p-2">Resource</th><th scope="col" className="p-2">Action</th>
          <th scope="col" className="p-2">Actor</th><th scope="col" className="p-2">When</th>
        </tr></thead>
        <tbody>{paged.map(event=><tr key={event.id} className="border-b border-border">
          <td className="p-2 break-words">{resourceLabel(event.resourceKey??event.subjectLabel??event.subjectId??event.summary)}</td>
          <td className="p-2">{resourceActionLabel(event.eventType)}</td>
          <td className="p-2"><span className="block">{event.actorDisplayName??event.actorUserId??"System"}</span><span className="block text-xs text-muted-foreground">{actorTypeLabel(event.actorType)}</span></td>
          <td className="p-2"><time dateTime={new Date(event.occurredAt).toISOString()}>
            {new Date(event.occurredAt).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})} IST
          </time></td>
        </tr>)}</tbody>
      </table>
    </div>
    : <div role="feed" aria-label="Project activity" aria-busy={busy} className="space-y-2">
      {filtered.map((event,index)=><Fragment key={event.id}>
        {mentorWeekSummary&&(index===0||
          eventIstDay(filtered[index-1]!.occurredAt)!==eventIstDay(event.occurredAt))?
          <h3 className="border-b border-border pt-4 text-sm font-semibold text-foreground">
            {eventIstDay(event.occurredAt)}
          </h3>:null}
        <article aria-posinset={index+1} aria-setsize={filtered.length}
         className="border-b border-border py-4">
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
      </article></Fragment>)}
     </div>}
  {resourceAudit&&totalPages>1?<nav aria-label="Resource audit pages" className="flex items-center gap-2">
    <Button type="button" variant="secondary" disabled={activePage<=1} onClick={()=>setPage(value=>Math.max(1,value-1))}>Previous</Button>
    <span className="text-sm" aria-live="polite">Page {activePage} of {totalPages}</span>
    <Button type="button" variant="secondary" disabled={activePage>=totalPages} onClick={()=>setPage(value=>Math.min(totalPages,value+1))}>Next</Button>
  </nav>:null}
  {activeHasMore?<Button variant="secondary" type="button" disabled={busy} onClick={()=>void loadMore()}
   className="">
   {busy?"Loading activity…":"Load more activity"}
  </Button>:null}
  {loadError?<p role="alert" className="text-sm text-error">{loadError}</p>:null}
 </section>;
}

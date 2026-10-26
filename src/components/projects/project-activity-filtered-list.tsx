"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import {Fragment,useEffect,useState,useRef} from "react";
import {apiFetch} from "@/lib/api-fetch";
import {mentorActivityCategory, mentorActivityLabel, mentorActivityRelativeTime} from "@/modules/projects/mentor-activity-display-model";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {mentorActivityCategoryChoices,mentorActivityGroup,type MentorActivityCategory} from "@/modules/projects/mentor-activity-category-model";
import {projectResourceAuditAction,projectResourceAuditMatches} from "@/modules/projects/project-resource-audit-model";
import {mentorLoadedWeekActivitySummary} from "@/modules/projects/mentor-week-activity-summary-model";
import {mentorFewestRecordedContributors} from "@/modules/projects/mentor-week-contributor-model";
import {mentorActivityMatchesDateFilters,mentorActivityIstDayKey}
 from "@/modules/projects/mentor-activity-date-filter-model";

type Event={id:string;eventType:string;importance:string;summary:string;actorDisplayName:string|null;subjectType?:string|null;occurredAt:string|Date;subjectLabel?:string|null;subjectId?:string|null;actorType?:string|null;actorUserId?:string|null;resourceKey?:string|null;sprintId?:string|null};
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
/** The route authorizes this project and tenant before resolving any event IDs. */
function mentorEventHref(projectId:string,event:Event):string{
 const base="/mentor/projects/"+encodeURIComponent(projectId);
 const safeId=typeof event.subjectId==="string"&&
   /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(event.subjectId)
   ?encodeURIComponent(event.subjectId):null;
 if(event.subjectType==="project_task"&&safeId)
   return base+"?tab=board&scope=all&task="+safeId;
 if(event.subjectType==="project_sprint"&&safeId)
   return base+"?tab=board&sprint="+safeId;
 if(event.subjectType==="project_meeting"&&safeId)
   return base+"?tab=team#meeting-"+safeId;
 if(event.subjectType==="project_submission"&&safeId)
   return base+"/deliveries/"+safeId+"/review";
 if(event.subjectType==="project_resource"&&safeId)
   return base+"?tab=resources#mentor-resource-"+safeId;
 if(event.subjectType==="project_resource")return base+"?tab=resources";
 if(event.eventType.startsWith("projects.delivery."))return base+"?tab=delivery";
 if(event.eventType.startsWith("projects.resource."))return base+"?tab=resources";
 return base+"?tab=activity";
}

export function ProjectActivityFilteredList({projectId,events,now,resourceAudit=false,sprints=[],mentorWeekSummary=false,weekContributors=[],weekTotals=null,resourceHistoryTotals=null,actorOptions=[]}:{
 projectId:string;events:Event[];now:string;resourceAudit?:boolean;
 sprints?:readonly {id:string;title:string;sequence:number}[];
 mentorWeekSummary?:boolean;
 weekContributors?:readonly {membershipId:string;name:string;eventCount:number}[];
 weekTotals?:{taskMoves:number;comments:number;resourcesShared:number;count:number}|null;
 resourceHistoryTotals?:{changes:number;added:number;edited:number;saved:number;removed:number}|null;
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
  actorGeneration.current+=1;
  setActorFeed(null);setActor("");setSprint("");setActorError("");setActorBusy(false);
  setItems(events);setHasMore(events.length>=100);setCursor(null);setBusy(false);setLoadError("");setPage(1);
  return ()=>{generation.current+=1;actorGeneration.current+=1;};
 },[projectId,events]);
 async function loadMore(){
  if(remoteActive){
    if(remoteBusy||!remote||remote.key!==remoteKey||!remote.hasMore||!remote.nextCursor)return;
    setRemoteBusy(true);setRemoteError("");
    const params=new URLSearchParams(serverParams);
    params.set("beforeTime",remote.nextCursor.time);
    params.set("beforeId",remote.nextCursor.id);
    try{
      const page=await apiFetch<Page>("/api/projects/"+encodeURIComponent(projectId)+
        "/activity?"+params.toString(),{cache:"no-store"});
      setRemote(old=>{
        if(!old||old.key!==remoteKey)return old;
        const seen=new Set(old.events.map(event=>event.id));
        return {...old,events:[...old.events,...page.events.filter(event=>!seen.has(event.id))],
          hasMore:page.hasMore,nextCursor:page.nextCursor};
      });
    }catch(reason){setRemoteError(reason instanceof Error?reason.message:
      "Could not load more matching history. Retry.");}
    finally{setRemoteBusy(false);}
    return;
  }
  if(actor||sprint){
   if(lock.current||!actorFeed?.hasMore||!actorFeed.nextCursor)return;
   lock.current=true;setBusy(true);setLoadError("");
   const generationNow=actorGeneration.current;
   const scopedKey=actor+"|"+sprint;
   const query=new URLSearchParams({
     ...(actor?{actorUserId:actor}:{}),
     ...(sprint?{sprintId:sprint}:{}),
     beforeTime:actorFeed.nextCursor.time,beforeId:actorFeed.nextCursor.id,
   });
   try{
    const page=await apiFetch<Page>("/api/projects/"+
      encodeURIComponent(projectId)+"/activity?"+query.toString(),
      {cache:"no-store"});
    if(generationNow!==actorGeneration.current)return;
    setActorFeed(previous=>{
      if(!previous||previous.id!==scopedKey)return previous;
      const seen=new Set(previous.events.map(event=>event.id));
      return {id:scopedKey,events:[...previous.events,
        ...page.events.filter(event=>!seen.has(event.id))],
        hasMore:page.hasMore,nextCursor:page.nextCursor};
    });
   }catch{
    if(generationNow===actorGeneration.current)
      setLoadError("Could not load older matching events. Retry.");
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
 const [mentorCategory,setMentorCategory]=useState<MentorActivityCategory>("ALL");
 const [resourceAction,setResourceAction]=useState("ALL");
 const [type,setType]=useState("");
 const [actor,setActor]=useState("");
 const [sprint,setSprint]=useState("");
 const [range,setRange]=useState("ALL");
 const [fromDate,setFromDate]=useState("");
 const [toDate,setToDate]=useState("");
 const serverParams=new URLSearchParams({size:"100"});
 const term=search.trim();
 if(term)serverParams.set("search",term.slice(0,100));
 if(resourceAudit)serverParams.set("category","RESOURCE");
 if(resourceAction!=="ALL")serverParams.set("resourceAction",resourceAction);
 else if(mentorWeekSummary&&mentorCategory!=="ALL")serverParams.set("category",mentorCategory);
 if(type)serverParams.set("eventType",type);
 if(actor)serverParams.set("actorUserId",actor);
 if(sprint)serverParams.set("sprintId",sprint);
 const dayNow=mentorActivityIstDayKey(now);
 const rolling=range==="7"||range==="30"
   ?mentorActivityIstDayKey(new Date(Date.parse(now)-Number(range)*86400000)):null;
 const start=fromDate|| (range==="1"?dayNow??"":rolling??"");
 const end=toDate|| (range==="1"?dayNow??"":"");
 if(start)serverParams.set("from",start);
 if(end)serverParams.set("to",end);
 const remoteActive=Boolean(term||type||actor||sprint||resourceAction!=="ALL"||
   mentorWeekSummary&&mentorCategory!=="ALL"||range!=="ALL"||fromDate||toDate);
 const remoteKey=serverParams.toString()+"&resourceAction="+resourceAction;
 const [remote,setRemote]=useState<{key:string;events:Event[];hasMore:boolean;nextCursor:Cursor|null}|null>(null);
 const [remoteBusy,setRemoteBusy]=useState(false);
 const [remoteError,setRemoteError]=useState("");
 useEffect(()=>{
   if(!remoteActive)return;
   const abort=new AbortController();
   // A saved query runs on the server before pagination, not just in browser rows.
   // This eliminates false "nothing found" results for matches on older pages.
   void Promise.resolve().then(async()=>{
     setRemoteBusy(true);setRemoteError("");
     try{
       const result=await apiFetch<Page>("/api/projects/"+encodeURIComponent(projectId)+
         "/activity?"+serverParams.toString(),{cache:"no-store",signal:abort.signal});
       if(abort.signal.aborted)return;
       setRemote({key:remoteKey,events:result.events,
         hasMore:result.hasMore,nextCursor:result.nextCursor});
       setPage(1);
     }catch(reason){
       if(!abort.signal.aborted)setRemoteError(reason instanceof Error?reason.message:
         "Could not search the full project history. Retry the filters.");
     }finally{if(!abort.signal.aborted)setRemoteBusy(false);}
   });
   return ()=>abort.abort();
 // Query string is the stable dependency; each change aborts the previous search.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[remoteActive,remoteKey,projectId]);
 // A type absent from the first loaded page must still be selectable.
 // Registered Project event codes form the stable filter vocabulary; add
 // imported unknown types once they are encountered without losing history.
 const categories=[...new Set([
   ...Object.values(ACTIVITY_EVENT_TYPES).filter(code=>code.startsWith("projects.")),
   ...items.map(event=>event.eventType),
 ])].sort();
 const actors=[...new Map([
    ...items.filter(event=>Boolean(event.actorUserId)).map(event=>
      ({id:event.actorUserId!,label:event.actorDisplayName??"Recorded actor"})),
    ...actorOptions,
   ].map(row=>[row.id,row] as const)).values()]
   .sort((a,b)=>a.label.localeCompare(b.label)||a.id.localeCompare(b.id));
 async function selectScopedHistory(nextActor:string,nextSprint:string){
   actorGeneration.current+=1;
   const generationNow=actorGeneration.current;
   const key=nextActor+"|"+nextSprint;
   setActor(nextActor);setSprint(nextSprint);setPage(1);
   setActorFeed(null);setActorError("");setLoadError("");setBusy(false);
   setActorBusy(Boolean(nextActor||nextSprint));
   if(!nextActor&&!nextSprint)return;
   try{
     const query=new URLSearchParams({
       ...(nextActor?{actorUserId:nextActor}:{}),
       ...(nextSprint?{sprintId:nextSprint}:{}),
     });
     const result=await apiFetch<Page>("/api/projects/"+
       encodeURIComponent(projectId)+"/activity?"+query.toString(),
       {cache:"no-store"});
     if(generationNow!==actorGeneration.current)return;
     setActorFeed({id:key,events:result.events,hasMore:result.hasMore,
       nextCursor:result.nextCursor});
   }catch{
     if(generationNow===actorGeneration.current)
       setActorError("Could not load the complete matching activity history. Retry the selection.");
   }finally{
     if(generationNow===actorGeneration.current)setActorBusy(false);
   }
 }
 const scopedKey=actor+"|"+sprint;
 const scoped=Boolean(actor||sprint);
 const remoteReady=remote?.key===remoteKey;
 const working=remoteActive?(remoteReady?remote.events:[]):scoped?
   (actorFeed?.id===scopedKey?actorFeed.events:[]):items;
 const activeHasMore=remoteActive?(remoteReady?remote.hasMore:false):scoped?
   (actorFeed?.id===scopedKey?actorFeed.hasMore:false):hasMore;
 const filtered=working.filter(event=>{
  const term=search.trim().toLocaleLowerCase("en-IN");
  return (!mentorWeekSummary||mentorCategory==="ALL"||mentorActivityGroup(event.eventType)===mentorCategory)
    &&(!resourceAudit||projectResourceAuditAction(event.eventType)!==null)
    &&(!term||[event.summary,event.actorDisplayName??"",event.actorUserId??"",event.actorType??"",actorTypeLabel(event.actorType),event.eventType,event.subjectLabel??"",event.subjectId??"",event.resourceKey??"",resourceLabel(event.resourceKey??event.subjectLabel),resourceActionLabel(event.eventType)].some(value=>value.toLocaleLowerCase("en-IN").includes(term)))
    &&projectResourceAuditMatches(event.eventType,resourceAction)
    &&(!type||event.eventType===type)
    &&(!actor||event.actorUserId===actor)
    &&mentorActivityMatchesDateFilters(event.occurredAt,now,range,fromDate,toDate);
 });
 const week=mentorWeekSummary?
   (weekTotals??mentorLoadedWeekActivitySummary(items,new Date(now))):null;
 const fewest=mentorWeekSummary?mentorFewestRecordedContributors(weekContributors):null;
 const resourceEvents=items.filter(item=>projectResourceAuditAction(item.eventType)!==null);
 const counts=[
  ["Changes",resourceHistoryTotals?.changes??resourceEvents.length],
  ["Added",resourceHistoryTotals?.added??resourceEvents.filter(item=>projectResourceAuditAction(item.eventType)==="Added").length],
  ["Edited",resourceHistoryTotals?resourceHistoryTotals.edited+resourceHistoryTotals.saved:resourceEvents.filter(item=>["Edited","Saved"].includes(projectResourceAuditAction(item.eventType)??"")).length],
  ["Removed",resourceHistoryTotals?.removed??resourceEvents.filter(item=>projectResourceAuditAction(item.eventType)==="Removed").length],
 ] as const;
 const totalPages=Math.max(1,Math.ceil(filtered.length/PAGE_SIZE));
 const activePage=Math.min(page,totalPages);
 const paged=resourceAudit?filtered.slice((activePage-1)*PAGE_SIZE,activePage*PAGE_SIZE):filtered;
 const resetFilters=()=>{
   actorGeneration.current+=1;setActorFeed(null);setActor("");setActorError("");setActorBusy(false);
   setSearch("");setMentorCategory("ALL");setResourceAction("ALL");setType("");setSprint("");
   setRange("ALL");setFromDate("");setToDate("");setPage(1);
 };
 return <section className="space-y-3">
  {week?<div aria-label="This week in project activity"
    className="space-y-1 rounded-lg border border-border p-3">
    <strong>{weekTotals?"This week · all recorded project activity":
      "This week · recorded in loaded activity"}</strong>
    <p>{week.taskMoves} task moves · {week.comments} comments ·
      {" "}{week.resourcesShared} shared resources · {week.count} total events</p>
    <p className="text-xs text-muted-foreground">
      {weekTotals?
        "Task, comment and resource totals cover the authorized full IST week, including events outside the loaded feed.":
        "The aggregate is unavailable, so these totals include only loaded events."}
      {" "}The learner comparison uses persisted events for the same IST week;
      it is not a measurement of attendance or contribution quality.
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
  {resourceAudit?<div role="group" aria-label="Resource activity totals" className="space-y-2">
    <p className="text-xs text-muted-foreground">{resourceHistoryTotals?
      "All recorded resource changes, across the authorized full project history; these totals are unfiltered by the controls below.":
      "Only recently loaded resource changes are counted here. These figures are not full-history totals."}</p>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{counts.map(([label,value])=><div key={label} className="rounded-lg border border-border p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="text-xl font-semibold tabular-nums">{value}</p></div>)}</div>
   </div>:null}
  {mentorWeekSummary?<div role="group" aria-label="Mentor activity categories"
    className="flex flex-wrap gap-2">
    {mentorActivityCategoryChoices.map(option=><Button key={option.value}
      type="button" size="sm"
      variant={mentorCategory===option.value?"primary":"secondary"}
      aria-pressed={mentorCategory===option.value}
      onClick={()=>{setMentorCategory(option.value);setPage(1);}}>
      {option.label}
    </Button>)}
  </div>:null}
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
     <Select value={actor} onChange={event=>void selectScopedHistory(event.target.value,sprint)}
       className="w-full">
       <option value="">By anyone</option>
       {actors.map(person=><option key={person.id} value={person.id}>{person.label}</option>)}
     </Select>
   </label>:null}
   {!resourceAudit&&sprints.length>0?<label className="grid gap-[6px] text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">
      In sprint
      <Select value={sprint} onChange={event=>void selectScopedHistory(actor,event.target.value)}
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
    <Input type="date" value={fromDate} max={toDate||mentorActivityIstDayKey(now)||undefined}
      onChange={event=>{setFromDate(event.target.value);setPage(1);}}
      className="w-full"/>
   </label>
   <label className="grid gap-[6px] text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">To date
    <Input type="date" value={toDate} min={fromDate||undefined} max={mentorActivityIstDayKey(now)||undefined}
      onChange={event=>{setToDate(event.target.value);setPage(1);}}
      className="w-full"/>
   </label>
   <Button variant="secondary" type="button" onClick={resetFilters}
      className="">Clear filters</Button>
  </div>
  {remoteActive&&(!remoteReady||remoteBusy)?<p role="status">
    {remoteReady?"Loading more matching history…":"Searching the full recorded project history…"}
  </p>:null}
  {remoteError?<p role="alert">{remoteError}</p>:null}
  {!remoteActive&&actorBusy?<p role="status">Loading complete recorded activity for the selected person or sprint…</p>:null}
  {actorError?<p role="alert">{actorError}</p>:null}
  <p className="text-xs text-muted-foreground">{resourceAudit
    ? filtered.length===0?"0 matching changes":`${(activePage-1)*PAGE_SIZE+1}–${Math.min(activePage*PAGE_SIZE,filtered.length)} of ${filtered.length} matching changes`
    :`${filtered.length} events`} · Times shown in IST.{sprint?" Events are scoped to the recorded sprint (including historical sprint updates).":""}{activeHasMore?" Load more to include older events.":""}</p>
  {remoteActive&&(!remoteReady||remoteError)&&!filtered.length?
    <p role="status">Results are not yet verified. The project history search must complete.</p>:
   !filtered.length&&activeHasMore?
    <p role="status">No matching events in the loaded batch. Older matching history may remain. Load more activity to continue.</p>:
   !filtered.length
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
       <Link className="mt-2 inline-flex min-h-9 items-center text-sm font-semibold text-link underline"
         href={mentorEventHref(projectId,event)}>
         Open related record →
       </Link>
      </article></Fragment>)}
     </div>}
  {resourceAudit&&totalPages>1?<nav aria-label="Resource audit pages" className="flex items-center gap-2">
    <Button type="button" variant="secondary" disabled={activePage<=1} onClick={()=>setPage(value=>Math.max(1,value-1))}>Previous</Button>
    <span className="text-sm" aria-live="polite">Page {activePage} of {totalPages}</span>
    <Button type="button" variant="secondary" disabled={activePage>=totalPages} onClick={()=>setPage(value=>Math.min(totalPages,value+1))}>Next</Button>
  </nav>:null}
  {activeHasMore?<Button variant="secondary" type="button" disabled={busy||remoteBusy} onClick={()=>void loadMore()}
   className="">
   {busy?"Loading activity…":"Load more activity"}
  </Button>:null}
  {loadError?<p role="alert" className="text-sm text-error">{loadError}</p>:null}
 </section>;
}

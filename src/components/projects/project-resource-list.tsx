"use client";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

import {Fragment,useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {StatusBadge} from "@/components/ui/status-badge";
import {ProjectResourceOpenLink} from "./project-resource-open-link";
import {ProjectResourceActions} from "./project-resource-controls";
import {safeProjectExternalHref} from "@/modules/projects/mentor-workspace-evidence-model";
import {mentorResourceGroupKey,mentorResourceGroupLabel,mentorResourceGroupOrder} from "@/modules/projects/mentor-resource-groups-model";

type ResourceRow={
 id:string;title:string;description:string|null;url:string|null;required:boolean;
 visibility:string;status:string;createdAt:Date;updatedAt:Date;sequence:number;
 resourceType?:string;pinned?:boolean;accessNotes?:string|null;templateKey?:string|null;
 sprintId?:string|null;taskId?:string|null;
};
export function ProjectResourceList({projectId,rows,mode,readOnly,sprints=[],tasks=[],sharers=[]}:{
 projectId:string;rows:readonly ResourceRow[];mode:"MENTOR"|"ADMIN"|"LEARNER";readOnly:boolean;
 sprints?:readonly {id:string;label:string;status?:string}[];tasks?:readonly {id:string;label:string}[];
 sharers?:readonly {resourceId:string;userId:string|null;displayName:string|null}[];
}){
 const [search,setSearch]=useState("");
 const [showEarlier,setShowEarlier]=useState(false);
 const [groupBySprint,setGroupBySprint]=useState(mode==="MENTOR");
 const [expanded,setExpanded]=useState<Record<string,boolean>>({});
 const [type,setType]=useState("ALL");
 const [visibility,setVisibility]=useState("ALL");
 const [status,setStatus]=useState("ACTIVE");
 const [pinned,setPinned]=useState(false);
 const [sprint,setSprint]=useState("");
 const [task,setTask]=useState("");
 const [sharer,setSharer]=useState("ALL");
 const bySharer=new Map(sharers.map(row=>[row.resourceId,row] as const));
 const sharerOptions=[...new Map(sharers.filter(row=>row.userId!==null)
   .map(row=>[row.userId!,row.displayName??"Recorded author"] as const)).entries()]
   .sort((a,b)=>a[1].localeCompare(b[1])||a[0].localeCompare(b[0]));
 const activeRows=rows.filter(row=>row.status==="ACTIVE");
 const sourceOrder=[...activeRows].sort((a,b)=>a.sequence-b.sequence).map(row=>row.id);
 const sourceKey=sourceOrder.join("|");
 const router=useRouter();
 const [orderIds,setOrderIds]=useState<string[]>(()=>sourceOrder);
 const [baselineIds,setBaselineIds]=useState<string[]>(()=>sourceOrder);
 const baseKey=baselineIds.join("|");
 const unsaved=orderIds.join("|")!==baseKey;
 const sourceChanged=sourceKey!==baseKey;
 useEffect(()=>{
   if(!unsaved&&sourceChanged){
     // Safe prop refresh: retain edits if the administrator is still editing.
     setBaselineIds(sourceOrder);
     setOrderIds(sourceOrder);
   }
 },[sourceKey,sourceChanged,unsaved]);
 const [reordering,setReordering]=useState(false);
 const [reorderError,setReorderError]=useState("");
 const canReorder=mode!=="LEARNER"&&!readOnly&&!reordering&&!sourceChanged&&
    !search.trim()&&type==="ALL"&&visibility==="ALL"&&status==="ACTIVE"&&!pinned&&
    !sprint&&!task&&sharer==="ALL"&&!groupBySprint&&activeRows.length<=250&&
    !(mode==="MENTOR"&&!showEarlier&&sprints.some(item=>item.status==="COMPLETED"&&
      activeRows.some(row=>row.sprintId===item.id)));
 async function saveOrder(){
   if(!canReorder||!unsaved)return;
   if(sourceChanged){setReorderError("Resources changed. Discard edits and refresh before saving.");return;}
   setReordering(true);setReorderError("");
   try{
     // Section-level CAS binds this save to the exact original ID order.
     // A concurrent reorder cannot silently overwrite another admin's work.
     await apiFetch("/api/projects/"+encodeURIComponent(projectId)+"/resources/reorder",{
       method:"POST",headers:{"content-type":"application/json"},
       body:JSON.stringify({orderIds,expectedOrderIds:baselineIds}),
     });
     setBaselineIds([...orderIds]);
     router.refresh();
   }catch(error){
     setReorderError(error instanceof Error&&/conflict|stale|changed/i.test(error.message)?
       "Resources changed since you started arranging. Discard changes to reload the latest order.":
       "Resource order could not be saved. Try again.");
   }finally{setReordering(false);}
 }
 function discardOrder(){
   setOrderIds(sourceOrder);
   setBaselineIds(sourceOrder);
   setReorderError("");
 }
 const stableOrder=[...orderIds.filter(id=>activeRows.some(item=>item.id===id)),
   ...activeRows.map(item=>item.id).filter(id=>!orderIds.includes(id))];
 function moveRelative(id:string,direction:-1|1){
   const from=stableOrder.indexOf(id),to=from+direction;
   if(from<0||to<0||to>=stableOrder.length)return;
   const next=[...stableOrder];
   [next[from],next[to]]=[next[to]!,next[from]!];
   setOrderIds(next);
 }
 function dropOnto(moving:string,target:string){
   if(moving===target||!stableOrder.includes(moving)||!stableOrder.includes(target))return;
   const next=stableOrder.filter(id=>id!==moving);
   next.splice(next.indexOf(target),0,moving);
   setOrderIds(next);
 }

 const matching=rows.filter(row=>{
  const link=Boolean(row.url&&safeProjectExternalHref(row.url));
  const kind=row.resourceType??(link?"LINK":"NOTE");
  return (!search.trim()||[row.title,row.description,row.url,row.accessNotes,row.resourceType,row.templateKey]
    .filter(Boolean).join(" ").toLocaleLowerCase("en-IN")
     .includes(search.trim().toLocaleLowerCase("en-IN")))
    &&(type==="ALL"||(type==="LINK"&&link)||(type==="OTHER"&&!link)||
      type===kind)
    &&(visibility==="ALL"||row.visibility===visibility)
    &&(status==="ALL"||row.status===status)
    &&(!pinned||row.pinned===true)
    &&(!sprint||row.sprintId===sprint)
    &&(!task||row.taskId===task)
    &&(sharer==="ALL"||(sharer==="UNKNOWN"?!bySharer.get(row.id)?.userId:
      bySharer.get(row.id)?.userId===sharer));
 });
 const earlierSprintIds=new Set(sprints.filter(item=>item.status==="COMPLETED").map(item=>item.id));
 const collapseEarlier=mode==="MENTOR"&&!showEarlier&&!search.trim()&&type==="ALL"&&
    visibility==="ALL"&&status==="ACTIVE"&&!pinned&&!sprint&&!task&&sharer==="ALL";
 const earlierCount=matching.filter(row=>row.sprintId!==null&&row.sprintId!==undefined&&
   earlierSprintIds.has(row.sprintId)).length;
 const filtered=collapseEarlier?matching.filter(row=>!row.sprintId||!earlierSprintIds.has(row.sprintId)):matching;
 const listOrder=[...filtered].sort((a,b)=>
   Number(Boolean(b.pinned))-Number(Boolean(a.pinned))||
   (a.status==="ACTIVE"?0:1)-(b.status==="ACTIVE"?0:1)||
   (a.status==="ACTIVE"?stableOrder.indexOf(a.id):a.sequence)-
   (b.status==="ACTIVE"?stableOrder.indexOf(b.id):b.sequence));
 const orderedResources=mode==="MENTOR"&&groupBySprint?
   mentorResourceGroupOrder(listOrder,sprints):listOrder;
 const groupKey=(row:ResourceRow)=>
   mentorResourceGroupKey(row,groupBySprint,sprints);
 const groupCounts=new Map<string,number>();
 for(const row of orderedResources){
   const key=groupKey(row);
   groupCounts.set(key,(groupCounts.get(key)??0)+1);
 }
 const files=rows.filter(row=>row.resourceType==="FILE").length;
 const links=rows.filter(row=>row.resourceType==="LINK"||
   (!row.resourceType&&Boolean(row.url&&safeProjectExternalHref(row.url)))).length;
 const other=rows.length-files-links;
 const archive=rows.filter(row=>row.status==="ARCHIVED").length;
 const drafts=rows.filter(row=>row.status==="DRAFT").length;
 const pinnedCount=rows.filter(row=>row.pinned).length;
 // The editor already shows its own resource summary for managers.
 const legacySummary=mode!=="LEARNER";

 return <section aria-label="Project resource directory" aria-busy={reordering} className="space-y-3">
  {/* The admin library editor immediately above owns the legacy headline
      and four metric chips; duplicating them in the read-only list would
      produce two different-looking resource library headers. */}
  {!legacySummary?<div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-4" aria-label="Resource counts">
   {([["Total",rows.length],["Showing",filtered.length],["Links",links],["Files",files],
      ["Other",other],["Drafts",drafts],["Archived",archive],["Pinned",pinnedCount]] as const)
      .map(([label,value])=><div key={label} role="group" aria-label={label+" resources"} className="rounded-[var(--lms-control-radius)] border border-border p-3 text-sm">
       <strong>{label}</strong><p className="mt-1 tabular-nums">{value}</p>
      </div>)}
  </div>:null}
  <div className="flex flex-wrap items-end gap-3 border-b border-border pb-4">
    {rows.length>12?<label className="grid min-w-40 flex-1 gap-[6px] text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">Search
      <Input type="search" value={search} onChange={event=>setSearch(event.target.value)}
       aria-label="Search resources" placeholder="Search title, key, notes, file name, or link" className=""/>
    </label>:null}
    <label className="grid gap-[6px] text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">Type
      <Select value={type} onChange={event=>setType(event.target.value)}
        className="">
       <option value="ALL">All types</option><option value="LINK">Links</option>
       <option value="OTHER">Other</option>
       {(["FILE","DOCUMENT","CODE","NOTE","ENVIRONMENT"] as const).map(kind=>
         <option key={kind} value={kind}>{kind[0]+kind.slice(1).toLowerCase()}</option>)}
      </Select>
    </label>
    {mode!=="LEARNER"?<label className="grid gap-[6px] text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">Visible to
      <Select value={visibility} onChange={event=>setVisibility(event.target.value)}
       className="">
        <option value="ALL">Everyone and mentors</option>
        <option value="TEAM">Everyone</option><option value="MENTOR_ONLY">Mentors only</option>
      </Select>
    </label>:null}
    {mode!=="LEARNER"?<>
      <label className="grid gap-[6px] text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">Status
        <Select value={status} onChange={event=>setStatus(event.target.value)}
          className="">
          <option value="ALL">All statuses</option><option value="ACTIVE">Active</option>
          <option value="DRAFT">Draft</option><option value="ARCHIVED">Archived</option>
        </Select>
      </label>
      <label className="flex min-h-10 items-center gap-2 text-xs font-semibold">
        <Checkbox className="size-5" checked={pinned} onChange={event=>setPinned(event.target.checked)}/>
        Pinned only
      </label>
      {mode==="MENTOR"?<label className="flex min-h-10 items-center gap-2 text-xs font-semibold">
        <Checkbox className="size-5" checked={groupBySprint}
          onChange={event=>setGroupBySprint(event.target.checked)}/>
        Show by sprint
      </label>:null}
      <label className="grid gap-[6px] text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">Sprint
        <Select value={sprint} onChange={event=>setSprint(event.target.value)}
          className="">
          <option value="">All sprints</option>
          {sprints.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}
        </Select>
      </label>
      {mode==="MENTOR"?<label className="grid gap-[6px] text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">Shared by · recorded creator
        <Select value={sharer} onChange={event=>setSharer(event.target.value)}>
          <option value="ALL">Anyone</option>
          {sharerOptions.map(([id,name])=><option value={id} key={id}>{name}</option>)}
          <option value="UNKNOWN">Creator not recorded</option>
        </Select>
      </label>:null}
      <label className="grid gap-[6px] text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">Task
        <Select value={task} onChange={event=>setTask(event.target.value)}
          className="">
          <option value="">All tasks</option>
          {tasks.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}
        </Select>
      </label>
    </>:null}
    <Button variant="secondary" type="button" onClick={()=>{setSearch("");setType("ALL");setVisibility("ALL");setStatus("ACTIVE");setPinned(false);setSprint("");setTask("");setSharer("ALL");}}
      className="min-h-11 text-sm font-[650] text-link underline md:min-h-9">Clear filters</Button>
  </div>
  {mode==="MENTOR"&&earlierCount>0?<div className="prototype-mentor-resource-earlier"
    role="group" aria-label="Earlier sprint resources">
    <span>Earlier sprints · {earlierCount} {earlierCount===1?"resource":"resources"}</span>
    <Button type="button" variant="secondary" size="sm"
      onClick={()=>setShowEarlier(value=>!value)} aria-pressed={showEarlier}>
      {showEarlier?"Hide earlier sprints":"Show earlier sprints"}
    </Button>
  </div>:null}
  {mode!=="LEARNER"&&!readOnly?<p role="status" className="text-xs text-muted-foreground leading-[20px]">
    {groupBySprint?"Turn off Show by sprint to rearrange the saved resource order.":
      canReorder?"Drag resources to arrange a draft, then select Save order.":
      activeRows.length>250?"Reorder up to 500 resources in Edit resource library; the directory only reorders complete lists of 250 or fewer.":
      "Resource reordering is available when no filters are active."}
  </p>:null}
  {mode!=="LEARNER"&&!readOnly&&unsaved?<div className="flex flex-wrap items-center gap-2" role="group" aria-label="Unsaved resource order">
    <span className="text-xs text-muted-foreground">Resource order has unsaved changes.</span>
    <Button type="button" disabled={!canReorder||sourceChanged} onClick={()=>void saveOrder()}>Save order</Button>
    <Button type="button" variant="secondary" disabled={reordering} onClick={discardOrder}>Discard changes</Button>
  </div>:null}
  {sourceChanged&&unsaved?<p role="alert" className="text-sm text-error">Resources changed since you started arranging. Discard changes to reload the latest order.</p>:null}
  {reorderError?<p role="alert" className="text-sm text-error leading-[22px]">{reorderError}</p>:null}
  {rows.length===0?<EmptyState title="No resources yet" description={mode==="LEARNER"
    ?"Share the first link or file with your team."
    :"Add the briefs, templates and reference links your team will need."}
  />:filtered.length===0?<EmptyState title="No matching resources"
    description="No resources match these filters. Clear filters to see all resources." />:<div className="space-y-3">{orderedResources.map((resource,index)=>{
    const safe=resource.url?safeProjectExternalHref(resource.url):null;
    const sourceSharer=bySharer.get(resource.id);
    return <Fragment key={resource.id}>
      {mode==="MENTOR"&&(index===0||
        (orderedResources[index-1]?groupKey(orderedResources[index-1]!)!==groupKey(resource):true))?
        <h3 className="prototype-mentor-resource-group-heading">
          {mentorResourceGroupLabel(groupKey(resource),sprints)}
          {" · "}{groupCounts.get(groupKey(resource))??0}
        </h3>:null}
    <article id={"mentor-resource-"+resource.id}
      tabIndex={-1}
      draggable={canReorder&&resource.status==="ACTIVE"}
      onDragStart={event=>{if(canReorder&&resource.status==="ACTIVE")event.dataTransfer.setData("text/plain",resource.id);}}
      onDragOver={event=>{if(canReorder&&resource.status==="ACTIVE")event.preventDefault();}}
      onDrop={event=>{if(!canReorder||resource.status!=="ACTIVE")return;event.preventDefault();
        dropOnto(event.dataTransfer.getData("text/plain"),resource.id);}}
      className="border-b border-border py-4">
     <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
       <p className="font-semibold text-foreground">{resource.title}</p>
       {mode==="MENTOR"?<p className="text-xs text-muted-foreground">
         Created by {sourceSharer?.displayName??"unknown recorded creator"} ·
         {" "}{new Intl.DateTimeFormat("en-IN",{
           day:"numeric",month:"short",year:"numeric",timeZone:"Asia/Kolkata",
         }).format(new Date(resource.createdAt))} IST
       </p>:null}
       {(rows.length<=12||expanded[resource.id])&&resource.description?<p className="mt-1 whitespace-pre-wrap break-words text-sm text-body leading-[22px]">{resource.description}</p>:null}
       {(rows.length<=12||expanded[resource.id])&&mode!=="LEARNER"&&resource.accessNotes?
         <p className="mt-2 whitespace-pre-wrap break-words text-xs text-body leading-[20px]">
           Access notes: {resource.accessNotes}
         </p>:null}
       {(rows.length<=12||expanded[resource.id])?<p className="mt-2 text-xs text-muted-foreground leading-[20px]">
        Last updated: <time dateTime={new Date(resource.updatedAt).toISOString()}>
         {new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",
           timeZone:"Asia/Kolkata"}).format(new Date(resource.updatedAt))} IST
        </time>
       </p>:null}
      </div>
      <div className="flex flex-wrap gap-2">
       <StatusBadge tone="neutral">{resource.resourceType??(safe?"Link":"Other")}</StatusBadge>
       <StatusBadge tone="neutral">{resource.status==="ARCHIVED"?"Archived":resource.status==="DRAFT"?"Draft":"Active"}</StatusBadge>
       {resource.visibility==="MENTOR_ONLY"&&mode!=="LEARNER"?<StatusBadge tone="neutral">Mentors only</StatusBadge>:null}
       {resource.required?<StatusBadge tone="warning">Required</StatusBadge>:null}
       {resource.pinned?<StatusBadge tone="warning">Pinned</StatusBadge>:null}
       {resource.sprintId?<StatusBadge tone="neutral">Sprint linked</StatusBadge>:null}
       {resource.taskId?<StatusBadge tone="neutral">Task linked</StatusBadge>:null}
      </div>
     </div>
     {rows.length>12?<Button variant="secondary" type="button" className="mt-2 text-xs"
       aria-expanded={Boolean(expanded[resource.id])} aria-controls={"resource-details-"+resource.id}
       onClick={()=>setExpanded(previous=>({...previous,[resource.id]:!previous[resource.id]}))}>
       {expanded[resource.id]?"Collapse":"Expand"} {resource.title}
     </Button>:null}
     <div id={"resource-details-"+resource.id} hidden={rows.length>12&&!expanded[resource.id]}>
     <ProjectResourceOpenLink url={resource.url} linkText={mode==="LEARNER"?"Open resource ↗":"Open link"}/>
     {canReorder&&resource.status==="ACTIVE"?<div className="mt-2 flex flex-wrap gap-2">
       <Button variant="secondary" type="button" disabled={stableOrder[0]===resource.id}
         aria-label={"Move up "+resource.title} className="text-xs"
         onClick={()=>moveRelative(resource.id,-1)}>Move up</Button>
       <Button variant="secondary" type="button" disabled={stableOrder.at(-1)===resource.id}
         aria-label={"Move down "+resource.title} className="text-xs"
         onClick={()=>moveRelative(resource.id,1)}>Move down</Button>
     </div>:null}
     {mode!=="LEARNER"&&!readOnly&&resource.status!=="ARCHIVED"?<ProjectResourceActions
        projectId={projectId} resource={{id:resource.id,title:resource.title,
         description:resource.description,url:resource.url,required:resource.required,
         visibility:resource.visibility==="MENTOR_ONLY"?"MENTOR_ONLY":"TEAM",
         resourceType:(["FILE","LINK","DOCUMENT","CODE","NOTE","ENVIRONMENT"].includes(resource.resourceType??"")
           ?resource.resourceType:"LINK") as "FILE"|"LINK"|"DOCUMENT"|"CODE"|"NOTE"|"ENVIRONMENT",
         status:resource.status==="DRAFT"?"DRAFT":resource.status==="ARCHIVED"?"ARCHIVED":"ACTIVE",
         ...(resource.pinned === undefined ? {} : { pinned: resource.pinned }),
         ...(resource.accessNotes === undefined ? {} : { accessNotes: resource.accessNotes }),
         updatedAt:resource.updatedAt,
         ...(resource.sprintId === undefined ? {} : { sprintId: resource.sprintId }),
         ...(resource.taskId === undefined ? {} : { taskId: resource.taskId })}}
        sprints={sprints} tasks={tasks}/>:null}
     </div>
    </article></Fragment>;
  })}</div>}
 </section>;
}

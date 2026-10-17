"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {StatusBadge} from "@/components/ui/status-badge";
import {ProjectResourceOpenLink} from "./project-resource-open-link";
import {ProjectResourceActions} from "./project-resource-controls";
import {safeProjectExternalHref} from "@/modules/projects/mentor-workspace-evidence-model";

type ResourceRow={
 id:string;title:string;description:string|null;url:string|null;required:boolean;
 visibility:string;status:string;createdAt:Date;updatedAt:Date;sequence:number;
 resourceType?:string;pinned?:boolean;accessNotes?:string|null;
 sprintId?:string|null;taskId?:string|null;
};
export function ProjectResourceList({projectId,rows,mode,readOnly,sprints=[],tasks=[]}:{
 projectId:string;rows:readonly ResourceRow[];mode:"MENTOR"|"ADMIN"|"LEARNER";readOnly:boolean;
 sprints?:readonly {id:string;label:string}[];tasks?:readonly {id:string;label:string}[];
}){
 const [search,setSearch]=useState("");
 const [type,setType]=useState("ALL");
 const [visibility,setVisibility]=useState("ALL");
 const [status,setStatus]=useState("ALL");
 const [pinned,setPinned]=useState(false);
 const [sprint,setSprint]=useState("");
 const [task,setTask]=useState("");
 const activeRows=rows.filter(row=>row.status==="ACTIVE");
 const router=useRouter();
 const [orderIds,setOrderIds]=useState<string[]>(()=>rows.filter(row=>row.status==="ACTIVE").map(row=>row.id));
 const [reordering,setReordering]=useState(false);
 const [reorderError,setReorderError]=useState("");
 const canReorder=mode!=="LEARNER"&&!readOnly&&!reordering&&
    !search.trim()&&type==="ALL"&&visibility==="ALL"&&status==="ALL"&&!pinned&&
    !sprint&&!task&&activeRows.length<=250;
 async function saveOrder(ids:string[]){
   if(!canReorder)return;
   setReordering(true);setReorderError("");
   try{
     await apiFetch("/api/projects/"+encodeURIComponent(projectId)+"/resources/reorder",{
       method:"POST",headers:{"content-type":"application/json"},
       body:JSON.stringify({orderIds:ids}),
     });
     setOrderIds(ids);
     router.refresh();
   }catch{
     setReorderError("Resource order could not be saved. Try again.");
   }finally{setReordering(false);}
 }
 const stableOrder=[...orderIds.filter(id=>activeRows.some(item=>item.id===id)),
   ...activeRows.map(item=>item.id).filter(id=>!orderIds.includes(id))];
 function moveRelative(id:string,direction:-1|1){
   const from=stableOrder.indexOf(id),to=from+direction;
   if(from<0||to<0||to>=stableOrder.length)return;
   const next=[...stableOrder];
   [next[from],next[to]]=[next[to]!,next[from]!];
   void saveOrder(next);
 }
 function dropOnto(moving:string,target:string){
   if(moving===target||!stableOrder.includes(moving)||!stableOrder.includes(target))return;
   const next=stableOrder.filter(id=>id!==moving);
   next.splice(next.indexOf(target),0,moving);
   void saveOrder(next);
 }

 const filtered=rows.filter(row=>{
  const link=Boolean(row.url&&safeProjectExternalHref(row.url));
  const kind=row.resourceType??(link?"LINK":"NOTE");
  return (!search.trim()||(row.title+" "+(row.description??"")).toLocaleLowerCase("en-IN")
     .includes(search.trim().toLocaleLowerCase("en-IN")))
    &&(type==="ALL"||(type==="LINK"&&link)||(type==="OTHER"&&!link)||
      type===kind)
    &&(visibility==="ALL"||row.visibility===visibility)
    &&(status==="ALL"||row.status===status)
    &&(!pinned||row.pinned===true)
    &&(!sprint||row.sprintId===sprint)
    &&(!task||row.taskId===task);
 });
 const links=rows.filter(row=>Boolean(row.url&&safeProjectExternalHref(row.url))).length;
 const archive=rows.filter(row=>row.status==="ARCHIVED").length;
 const drafts=rows.filter(row=>row.status==="DRAFT").length;
 const pinnedCount=rows.filter(row=>row.pinned).length;
 const currentOrder=(row:ResourceRow)=>row.status==="ACTIVE"?
   stableOrder.indexOf(row.id):rows.length+row.sequence;
 return <section aria-label="Project resource directory" className="space-y-3">
  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Resource counts">
   {([["Total",rows.length],["Showing",filtered.length],["Links",links],
     ["Files/other",rows.length-links],["Drafts",drafts],["Archived",archive],
     ["Pinned",pinnedCount]] as const)
     .map(([label,value])=><div key={label} className="rounded-lg border border-border p-3 text-sm">
       <strong>{label}</strong><p className="mt-1 tabular-nums">{value}</p>
     </div>)}
  </div>
  <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border p-3">
    <label className="grid min-w-40 flex-1 gap-1 text-xs font-semibold">Search
      <input type="search" value={search} onChange={event=>setSearch(event.target.value)}
       placeholder="Search resources" className="min-h-10 rounded border border-border bg-background px-3"/>
    </label>
    <label className="grid gap-1 text-xs font-semibold">Type
      <select value={type} onChange={event=>setType(event.target.value)}
        className="min-h-10 rounded border border-border bg-background px-3">
       <option value="ALL">All types</option><option value="LINK">Links</option>
       <option value="OTHER">Other</option>
       {(["FILE","DOCUMENT","CODE","NOTE","ENVIRONMENT"] as const).map(kind=>
         <option key={kind} value={kind}>{kind[0]+kind.slice(1).toLowerCase()}</option>)}
      </select>
    </label>
    {mode!=="LEARNER"?<label className="grid gap-1 text-xs font-semibold">Visible to
      <select value={visibility} onChange={event=>setVisibility(event.target.value)}
       className="min-h-10 rounded border border-border bg-background px-3">
        <option value="ALL">Everyone and mentors</option>
        <option value="TEAM">Everyone</option><option value="MENTOR_ONLY">Mentors only</option>
      </select>
    </label>:null}
    {mode!=="LEARNER"?<>
      <label className="grid gap-1 text-xs font-semibold">Status
        <select value={status} onChange={event=>setStatus(event.target.value)}
          className="min-h-10 rounded border border-border bg-background px-3">
          <option value="ALL">All statuses</option><option value="ACTIVE">Active</option>
          <option value="DRAFT">Draft</option><option value="ARCHIVED">Archived</option>
        </select>
      </label>
      <label className="flex min-h-10 items-center gap-2 text-xs font-semibold">
        <input type="checkbox" checked={pinned} onChange={event=>setPinned(event.target.checked)}/>
        Pinned only
      </label>
      <label className="grid gap-1 text-xs font-semibold">Sprint
        <select value={sprint} onChange={event=>setSprint(event.target.value)}
          className="min-h-10 rounded border border-border bg-background px-3">
          <option value="">All sprints</option>
          {sprints.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-xs font-semibold">Task
        <select value={task} onChange={event=>setTask(event.target.value)}
          className="min-h-10 rounded border border-border bg-background px-3">
          <option value="">All tasks</option>
          {tasks.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </label>
    </>:null}
    <button type="button" onClick={()=>{setSearch("");setType("ALL");setVisibility("ALL");setStatus("ALL");setPinned(false);setSprint("");setTask("");}}
      className="min-h-10 text-sm font-semibold text-primary-text underline">Clear filters</button>
  </div>
  {mode!=="LEARNER"&&!readOnly?<p role="status" className="text-xs text-muted-foreground">
    {canReorder?"Drag resources to change their priority order, or use Move up and Move down.":
      "Resource reordering is available when no filters are active."}
  </p>:null}
  {reorderError?<p role="alert" className="text-sm text-error">{reorderError}</p>:null}
  {rows.length===0?<p className="rounded-xl border border-border bg-surface p-5 text-sm text-muted-foreground">
    {mode==="LEARNER"?"No resources yet. Share the first link or file with your team."
      :"No resources yet. Add the briefs, templates and reference links your team will need."}
  </p>:filtered.length===0?<p role="status" className="rounded-xl border border-border p-5 text-sm text-body">
    No resources match these filters. Clear filters to see all resources.
  </p>:<div className="space-y-3">{[...filtered].sort((a,b)=>
      Number(Boolean(b.pinned))-Number(Boolean(a.pinned))||currentOrder(a)-currentOrder(b)).map(resource=>{
    const safe=resource.url?safeProjectExternalHref(resource.url):null;
    return <article key={resource.id}
      draggable={canReorder&&resource.status==="ACTIVE"}
      onDragStart={event=>{if(canReorder&&resource.status==="ACTIVE")event.dataTransfer.setData("text/plain",resource.id);}}
      onDragOver={event=>{if(canReorder&&resource.status==="ACTIVE")event.preventDefault();}}
      onDrop={event=>{if(!canReorder||resource.status!=="ACTIVE")return;event.preventDefault();
        dropOnto(event.dataTransfer.getData("text/plain"),resource.id);}}
      className="rounded-xl border border-border bg-surface p-4">
     <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
       <p className="font-semibold text-foreground">{resource.title}</p>
       {resource.description?<p className="mt-1 whitespace-pre-wrap break-words text-sm text-body">{resource.description}</p>:null}
       {mode!=="LEARNER"&&resource.accessNotes?
         <p className="mt-2 whitespace-pre-wrap break-words text-xs text-body">
           Access notes: {resource.accessNotes}
         </p>:null}
       <p className="mt-2 text-xs text-muted-foreground">
        Last updated: <time dateTime={new Date(resource.updatedAt).toISOString()}>
         {new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",
           timeZone:"Asia/Kolkata"}).format(new Date(resource.updatedAt))} IST
        </time>
       </p>
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
     {resource.url?<ProjectResourceOpenLink url={resource.url} linkText={mode==="LEARNER"?"Open resource ↗":"Open link"}/>:null}
     {canReorder&&resource.status==="ACTIVE"?<div className="mt-2 flex flex-wrap gap-2">
       <button type="button" disabled={stableOrder[0]===resource.id}
         className="min-h-9 rounded border border-border px-3 text-xs font-semibold disabled:opacity-50"
         onClick={()=>moveRelative(resource.id,-1)}>Move up</button>
       <button type="button" disabled={stableOrder.at(-1)===resource.id}
         className="min-h-9 rounded border border-border px-3 text-xs font-semibold disabled:opacity-50"
         onClick={()=>moveRelative(resource.id,1)}>Move down</button>
     </div>:null}
     {mode!=="LEARNER"&&!readOnly&&resource.status!=="ARCHIVED"?<ProjectResourceActions
        projectId={projectId} resource={{id:resource.id,title:resource.title,
         description:resource.description,url:resource.url,required:resource.required,
         visibility:resource.visibility==="MENTOR_ONLY"?"MENTOR_ONLY":"TEAM",
         resourceType:(["FILE","LINK","DOCUMENT","CODE","NOTE","ENVIRONMENT"].includes(resource.resourceType??"")
           ?resource.resourceType:"LINK") as "FILE"|"LINK"|"DOCUMENT"|"CODE"|"NOTE"|"ENVIRONMENT",
         status:resource.status==="DRAFT"?"DRAFT":resource.status==="ARCHIVED"?"ARCHIVED":"ACTIVE",
         pinned:resource.pinned,accessNotes:resource.accessNotes,
         sprintId:resource.sprintId,taskId:resource.taskId}}
        sprints={sprints} tasks={tasks}/>:null}
    </article>;
  })}</div>}
 </section>;
}

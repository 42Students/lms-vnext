"use client";

import {useState} from "react";
import {StatusBadge} from "@/components/ui/status-badge";
import {ProjectResourceOpenLink} from "./project-resource-open-link";
import {ProjectResourceActions} from "./project-resource-controls";
import {safeProjectExternalHref} from "@/modules/projects/mentor-workspace-evidence-model";

type ResourceRow={
 id:string;title:string;description:string|null;url:string|null;required:boolean;
 visibility:string;status:string;createdAt:Date;updatedAt:Date;sequence:number;
};
export function ProjectResourceList({projectId,rows,mode,readOnly}:{
 projectId:string;rows:readonly ResourceRow[];mode:"MENTOR"|"ADMIN"|"LEARNER";readOnly:boolean;
}){
 const [search,setSearch]=useState("");
 const [type,setType]=useState("ALL");
 const [visibility,setVisibility]=useState("ALL");
 const filtered=rows.filter(row=>{
  const link=Boolean(row.url&&safeProjectExternalHref(row.url));
  return (!search.trim()||(row.title+" "+(row.description??"")).toLocaleLowerCase("en-IN")
     .includes(search.trim().toLocaleLowerCase("en-IN")))
    &&(type==="ALL"||(type==="LINK"&&link)||(type==="OTHER"&&!link))
    &&(visibility==="ALL"||row.visibility===visibility);
 });
 const links=rows.filter(row=>Boolean(row.url&&safeProjectExternalHref(row.url))).length;
 return <section aria-label="Project resource directory" className="space-y-3">
  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Resource counts">
   {([["Total",rows.length],["Showing",filtered.length],["Links",links],["Other",rows.length-links]] as const)
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
      </select>
    </label>
    {mode!=="LEARNER"?<label className="grid gap-1 text-xs font-semibold">Visible to
      <select value={visibility} onChange={event=>setVisibility(event.target.value)}
       className="min-h-10 rounded border border-border bg-background px-3">
        <option value="ALL">Everyone and mentors</option>
        <option value="TEAM">Everyone</option><option value="MENTOR_ONLY">Mentors only</option>
      </select>
    </label>:null}
    <button type="button" onClick={()=>{setSearch("");setType("ALL");setVisibility("ALL");}}
      className="min-h-10 text-sm font-semibold text-primary-text underline">Clear filters</button>
  </div>
  {rows.length===0?<p className="rounded-xl border border-border bg-surface p-5 text-sm text-muted-foreground">
    {mode==="LEARNER"?"No resources yet. Share the first link or file with your team."
      :"No resources yet. Add the briefs, templates and reference links your team will need."}
  </p>:filtered.length===0?<p role="status" className="rounded-xl border border-border p-5 text-sm text-body">
    No resources match these filters. Clear filters to see all resources.
  </p>:<div className="space-y-3">{filtered.map(resource=>{
    const safe=resource.url?safeProjectExternalHref(resource.url):null;
    return <article key={resource.id} className="rounded-xl border border-border bg-surface p-4">
     <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
       <p className="font-semibold text-foreground">{resource.title}</p>
       {resource.description?<p className="mt-1 whitespace-pre-wrap break-words text-sm text-body">{resource.description}</p>:null}
       <p className="mt-2 text-xs text-muted-foreground">
        Last updated: <time dateTime={new Date(resource.updatedAt).toISOString()}>
         {new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",
           timeZone:"Asia/Kolkata"}).format(new Date(resource.updatedAt))} IST
        </time>
       </p>
      </div>
      <div className="flex flex-wrap gap-2">
       <StatusBadge tone="neutral">{safe?"Link":"Other"}</StatusBadge>
       <StatusBadge tone="neutral">{resource.status==="ARCHIVED"?"Archived":"Active"}</StatusBadge>
       {resource.visibility==="MENTOR_ONLY"&&mode!=="LEARNER"?<StatusBadge tone="neutral">Mentors only</StatusBadge>:null}
       {resource.required?<StatusBadge tone="warning">Required</StatusBadge>:null}
      </div>
     </div>
     {resource.url?<ProjectResourceOpenLink url={resource.url} linkText={mode==="LEARNER"?"Open resource ↗":"Open link"}/>:null}
     {mode!=="LEARNER"&&!readOnly&&resource.status==="ACTIVE"?<ProjectResourceActions
        projectId={projectId} resource={{id:resource.id,title:resource.title,
         description:resource.description,url:resource.url,required:resource.required,
         visibility:resource.visibility==="MENTOR_ONLY"?"MENTOR_ONLY":"TEAM"}}/>:null}
    </article>;
  })}</div>}
 </section>;
}

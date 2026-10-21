"use client";

import {useEffect,useState} from "react";
import Link from "next/link";
import {Button} from "@/components/ui/button";
import {Dialog} from "@/components/ui/dialog";
import {StatusBadge} from "@/components/ui/status-badge";

type Summary = {
 id:string;title:string;summary:string|null;status:string;
 mentorName:string|null;memberCount:number;progressPercent:number;
 courseLabel?:string|null;phase?:string|null;dueLabel?:string|null;
};
type ProjectDetail = {
 slug?:string|null;courseLabel?:string|null;phase?:string|null;
 status?:string|null;progressPercent?:number|null;
 dueLabel?:string|null;endDate?:string|null;
 blocker?:string|null;nextAction?:string|null;
};
type Member = {id:string;role:string;roleKind?:string|null;roleLabel?:string|null;
 isPrimary?:boolean;displayName:string;startedAt?:string|null};

/** The legacy Super Admin list's 520px at-a-glance view.
 * Current project and membership records are fetched only after opening the drawer.
 * Both endpoints apply the selected college and caller's persisted permissions. */
export function ProjectAdminWorkspaceQuickView({item,href}:{
 item:Summary;href:string;
}){
 const [open,setOpen]=useState(false);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState("");
 const [detail,setDetail]=useState<ProjectDetail|null>(null);
 const [members,setMembers]=useState<Member[]|null>(null);
 const [reload,setReload]=useState(0);
 useEffect(()=>{
  if(!open)return;
  const controller=new AbortController();
  const options={signal:controller.signal,credentials:"same-origin" as const,
   cache:"no-store" as const};
  setLoading(true);setError("");
  setDetail(null);setMembers(null);
  void Promise.all([
   fetch("/api/projects/"+encodeURIComponent(item.id),options),
   fetch("/api/projects/"+encodeURIComponent(item.id)+"/members",options),
  ]).then(async([workspaceResponse,membersResponse])=>{
   if(!workspaceResponse.ok||!membersResponse.ok)
    throw new Error("Workspace details could not be loaded for the selected college.");
   const [workspaceJson,membersJson]=await Promise.all([
    workspaceResponse.json() as Promise<{workspace?:{project?:ProjectDetail}}>,
    membersResponse.json() as Promise<{members?:Member[]}>,
   ]);
   if(controller.signal.aborted)return;
   setDetail(workspaceJson.workspace?.project??null);
   setMembers(Array.isArray(membersJson.members)?membersJson.members:[]);
  }).catch(()=>{
   if(!controller.signal.aborted)
    setError("Workspace could not be loaded. Check your selected college and retry.");
  }).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
  return()=>controller.abort();
 },[open,item.id,reload]);
 const facts=[
  ["Slug",detail?.slug||"—"],
  ["Course",detail?.courseLabel||item.courseLabel||"—"],
  ["Mentor",item.mentorName||"—"],
  ["Phase",detail?.phase||item.phase||"—"],
  ["Status",detail?.status||item.status||"—"],
  ["Progress",Number.isFinite(detail?.progressPercent??item.progressPercent)
   ?String(Math.max(0,Math.min(100,detail?.progressPercent??item.progressPercent)))+"%":"—"],
  ["Due",detail?.endDate||detail?.dueLabel||item.dueLabel||"Not set"],
  ["Blocker",detail?.blocker||"None recorded"],
  ["Next Action",detail?.nextAction||"Not set"],
 ] as const;
 return <>
  <Button type="button" variant="secondary" size="sm"
   aria-label={"View details for "+item.title} onClick={()=>setOpen(true)}>
   View
  </Button>
  <Dialog open={open} onOpenChange={setOpen} title="Workspace details"
   description="Quick view · Selected college"
   className="!left-auto !right-0 !top-0 !h-[100dvh] !max-h-[100dvh] !w-[min(520px,100vw)] !max-w-[520px] !translate-x-0 !translate-y-0 !rounded-none"
   footer={<div className="flex flex-wrap gap-2">
    <Button variant="secondary" onClick={()=>setOpen(false)}>Close</Button>
    <Link href={href} className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] bg-[var(--lms-button-primary)] px-4 text-sm font-semibold text-white md:min-h-9">
      Open full workspace
    </Link>
   </div>}>
   <div className="min-w-0 space-y-4">
    <div>
     <h3 className="break-words text-base font-semibold text-foreground">{item.title}</h3>
     <p className="mt-1 whitespace-pre-wrap text-sm text-body">{item.summary||"No workspace summary has been added yet."}</p>
    </div>
    {loading?<div role="status" aria-live="polite" className="space-y-2 text-sm text-body">
     <p>Loading workspace details…</p>
     {Array.from({length:6},(_,i)=><div key={i} aria-hidden="true"
       className="h-7 animate-pulse rounded bg-[var(--lms-neutral-50)]"/>)}
    </div>:null}
    {error?<div role="alert" className="border-y border-warning-border p-3 text-sm text-body">
     <p>{error}</p>
     <Button variant="secondary" size="sm" className="mt-2"
      onClick={()=>setReload(n=>n+1)}>Retry</Button>
    </div>:null}
    {!loading&&!error?<>
     <dl className="grid min-w-0 grid-cols-2 gap-x-4 gap-y-3 border-y border-[var(--lms-canvas-border)] py-3 text-sm">
      {facts.map(([label,value])=><div key={label} className="min-w-0">
       <dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
       <dd className="mt-1 break-words text-foreground">{value}</dd>
      </div>)}
     </dl>
     <section aria-label="Project members" className="space-y-2">
      <h4 className="text-sm font-semibold text-foreground">
       Members · {members?.length??item.memberCount}
      </h4>
      {(members??[]).length? <ul className="divide-y divide-border">
       {(members??[]).map(member=><li key={member.id}
        className="flex flex-wrap items-center justify-between gap-2 py-2">
        <span className="min-w-0 break-words text-sm font-semibold">{member.displayName||"Unnamed member"}</span>
        <span className="flex flex-wrap gap-1">
         <StatusBadge tone="neutral">{member.roleLabel||member.role}</StatusBadge>
         {member.roleKind?<StatusBadge tone="neutral">{member.roleKind}</StatusBadge>:null}
         {member.isPrimary?<StatusBadge tone="info">Primary</StatusBadge>:null}
        </span>
       </li>)}
      </ul>:<p className="text-sm text-body">No active members in this workspace.</p>}
     </section>
    </>:null}
   </div>
  </Dialog>
 </>;
}

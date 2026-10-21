"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Radio } from "@/components/ui/radio";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import {useMemo,useState} from "react";
import styles from "./legacy-project-touch-actions.module.css";
type Workspace={id:string;title:string;status:string};
export function AdminReadinessWorkspacePicker({items,selected,action}:{
 items:Workspace[];selected:string|null;action:string;
}){
 const [search,setSearch]=useState("");
 const [choice,setChoice]=useState(selected??"");
 const [page,setPage]=useState(1),pageSize=25;
 const matching=useMemo(()=>items.filter(item=>
  (item.title+" "+item.id).toLocaleLowerCase().includes(search.toLocaleLowerCase())),[items,search]);
 const count=Math.max(1,Math.ceil(matching.length/pageSize)),current=Math.min(page,count);
 const rows=matching.slice((current-1)*pageSize,current*pageSize);
 return <form method="get" action={action} className={"min-w-0 space-y-3 "+styles.legacy}>
  <label className="block text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Search workspace title or ID
   <Input value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}}
    placeholder="Search workspace" className="mt-1 min-h-11 w-full md:min-h-9"/></label>
  <fieldset className="max-h-64 min-w-0 space-y-1 overflow-y-auto overscroll-contain rounded-[var(--lms-control-radius)] border border-border bg-surface p-2">
   <legend className="sr-only">Select a workspace</legend>
   {rows.map(item=><label key={item.id} className="flex min-h-11 min-w-0 cursor-pointer items-center gap-2 rounded-[var(--lms-control-radius)] px-2 text-sm text-body hover:bg-primary-subtle focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary min-[768px]:min-h-9">
    <Radio name="workspaceId" value={item.id} checked={choice===item.id}
      onChange={()=>setChoice(item.id)}/>
    <span className="min-w-0 flex-1 break-words">{item.title}</span>
    <StatusBadge tone={item.status==="ACTIVE"||item.status==="COMPLETED"?"success":item.status==="PLANNED"?"info":"neutral"} className="shrink-0">{item.status}</StatusBadge>
   </label>)}
   {!rows.length?<EmptyState title="No matching workspaces" description="No matching workspaces."/>:null}
  </fieldset>
  <div className="flex min-w-0 flex-col gap-2 text-sm text-body md:flex-row md:items-center md:justify-between">
   <span>{matching.length === 0 ? "0–0" : ((current - 1) * pageSize + 1) + "–" + Math.min(current * pageSize, matching.length)} of {matching.length}{items.length >= 1000 ? " (first 1,000 loaded)" : ""}</span>
   <div className="flex flex-wrap gap-2">
    <Button type="button" variant="secondary" disabled={current===1} onClick={()=>setPage(x=>Math.max(1,x-1))}
      >Previous</Button>
    <Button type="button" variant="secondary" disabled={current===count} onClick={()=>setPage(x=>Math.min(count,x+1))}
      >Next</Button>
   </div>
  </div>
  <Button type="submit" disabled={!choice} className="min-h-11 w-full md:min-h-9 md:w-auto">
   View readiness</Button>
 </form>;
}

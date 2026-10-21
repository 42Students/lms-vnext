"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
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
  <label className="block text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Select workspace
   <Input value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}}
    placeholder="Search workspaces by title or ID" aria-label="Search workspaces by title or ID" className="mt-1 min-h-11 w-full max-w-[420px] md:min-h-9"/></label>
  <label className="grid min-w-0 max-w-[420px] gap-1 text-sm font-semibold text-muted-foreground">
    Select workspace
    <Select name="workspaceId" aria-label="Select workspace" value={choice}
      onChange={event=>setChoice(event.target.value)} required className="min-h-11 w-full md:min-h-9">
      <option value="">Select a workspace</option>
      {rows.map(item=><option value={item.id} key={item.id}>{item.title} · {item.status}</option>)}
      {choice&&!rows.some(item=>item.id===choice)?<option value={choice}>
        {items.find(item=>item.id===choice)?.title??"Selected workspace"}
      </option>:null}
    </Select>
  </label>
  {!rows.length?<EmptyState title="No matching workspaces" description="Change the search to find another workspace."/>:null}

  <div className="flex min-w-0 flex-col gap-2 text-sm text-body md:flex-row md:items-center md:justify-between">
   <span>{matching.length === 0 ? "0–0" : ((current - 1) * pageSize + 1) + "–" + Math.min(current * pageSize, matching.length)} of {matching.length}{items.length >= 1000 ? " (first 1,000 loaded)" : ""}</span>
   <div className="flex flex-wrap gap-2">
    <Button type="button" variant="secondary" disabled={current===1} onClick={()=>setPage(x=>Math.max(1,x-1))}
      >Previous workspaces</Button>
    <Button type="button" variant="secondary" disabled={current===count} onClick={()=>setPage(x=>Math.min(count,x+1))}
      >Next workspaces</Button>
   </div>
  </div>
  <Button type="submit" disabled={!choice} className="min-h-11 w-full md:min-h-9 md:w-auto">
   View readiness</Button>
 </form>;
}

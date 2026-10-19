"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {useMemo,useState} from "react";
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
 return <form method="get" action={action} className="space-y-3">
  <label className="block text-sm font-semibold">Search workspace title or ID
   <Input value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}}
    placeholder="Search workspace" className="mt-1 w-full"/></label>
  <fieldset className="max-h-64 min-w-0 space-y-1 overflow-y-auto overscroll-contain rounded-[var(--lms-control-radius)] border border-border p-2">
   <legend className="sr-only">Select a workspace</legend>
   {rows.map(item=><label key={item.id} className="flex min-h-11 min-w-0 cursor-pointer items-center gap-2 text-sm">
    <input type="radio" className="size-4 accent-[var(--lms-button-primary)]" name="workspaceId" value={item.id} checked={choice===item.id}
      onChange={()=>setChoice(item.id)}/>
    <span className="min-w-0 flex-1 break-words">{item.title}</span>
    <span className="text-xs text-muted-foreground">{item.status}</span>
   </label>)}
   {!rows.length?<p className="p-3 text-sm text-muted-foreground">No matching workspaces.</p>:null}
  </fieldset>
  <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
   <span>{matching.length} matching · Page {current} of {count}</span>
   <div className="flex flex-wrap gap-2">
    <Button type="button" variant="secondary" disabled={current===1} onClick={()=>setPage(x=>Math.max(1,x-1))}
      >Previous</Button>
    <Button type="button" variant="secondary" disabled={current===count} onClick={()=>setPage(x=>Math.min(count,x+1))}
      >Next</Button>
   </div>
  </div>
  <Button type="submit" disabled={!choice} >
   View readiness</Button>
 </form>;
}

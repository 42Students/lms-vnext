"use client";
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
   <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}}
    placeholder="Search workspace" className="mt-1 min-h-11 w-full rounded-md border border-border bg-background px-3"/></label>
  <fieldset className="max-h-64 space-y-1 overflow-y-auto rounded-md border border-border p-2">
   <legend className="sr-only">Select a workspace</legend>
   {rows.map(item=><label key={item.id} className="flex min-h-10 cursor-pointer items-center gap-2 text-sm">
    <input type="radio" name="workspaceId" value={item.id} checked={choice===item.id}
      onChange={()=>setChoice(item.id)}/>
    <span className="flex-1">{item.title}</span>
    <span className="text-xs text-muted-foreground">{item.status}</span>
   </label>)}
   {!rows.length?<p className="p-3 text-sm text-muted-foreground">No matching workspaces.</p>:null}
  </fieldset>
  <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
   <span>{matching.length} matching · Page {current} of {count}</span>
   <div className="flex gap-2">
    <button type="button" disabled={current===1} onClick={()=>setPage(x=>Math.max(1,x-1))}
      className="rounded-md border border-border px-3 py-2 disabled:opacity-50">Previous</button>
    <button type="button" disabled={current===count} onClick={()=>setPage(x=>Math.min(count,x+1))}
      className="rounded-md border border-border px-3 py-2 disabled:opacity-50">Next</button>
   </div>
  </div>
  <button type="submit" disabled={!choice} className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">
   View readiness</button>
 </form>;
}

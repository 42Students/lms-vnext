"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Radio } from "@/components/ui/radio";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import {useEffect,useRef,useState} from "react";
import styles from "./legacy-project-touch-actions.module.css";
type Workspace={id:string;title:string;status:string};
export function AdminReadinessWorkspacePicker({items,selected,action,collegeId,initialTotal}:{
 items:Workspace[];selected:string|null;action:string;collegeId:string;initialTotal:number;
}){

 const [search,setSearch]=useState("");
 const [choice,setChoice]=useState(selected??"");
 const [rememberedChoice,setRememberedChoice]=useState<Workspace|null>(
   () => items.find(item=>item.id===selected)??null);
 const [page,setPage]=useState(1);
 const [retryTick,setRetryTick]=useState(0);
 const [result,setResult]=useState({items:items.slice(0,25),total:initialTotal,
   page:1,pageSize:25,totalPages:Math.max(1,Math.ceil(initialTotal/25))});
 const [busy,setBusy]=useState(false),[error,setError]=useState("");
 const requestSeq=useRef(0);
 useEffect(()=>{
  const request=++requestSeq.current;
  const controller=new AbortController();
  const timer=window.setTimeout(()=>{
   setBusy(true);setError("");
   const params=new URLSearchParams({collegeId,q:search.trim(),page:String(page)});
   void fetch("/api/projects/readiness-choices?"+params.toString(),{
    signal:controller.signal,credentials:"same-origin",cache:"no-store",
   }).then(async response=>{
    if(!response.ok)throw Error("Couldn't load workspaces. Retry the search.");
    return response.json() as Promise<{
      items:Workspace[];total:number;page:number;pageSize:number;totalPages:number;
    }>;
   }).then(data=>{
    if(!controller.signal.aborted&&request===requestSeq.current)setResult(data);
   }).catch(()=>{
    if(!controller.signal.aborted&&request===requestSeq.current)
      setError("Couldn't load workspaces. Retry the search.");
   }).finally(()=>{
    if(!controller.signal.aborted&&request===requestSeq.current)setBusy(false);
   });
  },250);
  return()=>{window.clearTimeout(timer);controller.abort();};
 },[collegeId,page,search,retryTick]);
 const current=result.page,total=result.total,count=result.totalPages;
 const selectedRow=result.items.find(item=>item.id===choice)??
   items.find(item=>item.id===choice)??
   (rememberedChoice?.id===choice?rememberedChoice:null);
 const rows=selectedRow&&!result.items.some(item=>item.id===selectedRow.id)
   ?[selectedRow,...result.items]:result.items;
 const startIndex=total===0?0:(current-1)*25+1,finish=Math.min(total,current*25);
 return <form method="get" action={action} className={"min-w-0 space-y-3 "+styles.legacy}>
  {choice?<input type="hidden" name="workspaceId" value={choice}/>:null}
  <label className="block text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Search workspace title or ID
   <Input type="search" maxLength={120} value={search}
    onChange={e=>{setSearch(e.target.value);setPage(1)}}
    placeholder="Search workspace" className="mt-1 min-h-11 w-full md:min-h-9"/></label>
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  <fieldset disabled={busy||Boolean(error)} className="max-h-64 min-w-0 space-y-1 overflow-y-auto overscroll-contain rounded-[var(--lms-control-radius)] border border-border bg-surface p-2">
   <legend className="sr-only">Select a workspace</legend>
   {rows.map(item=><label key={item.id} className="flex min-h-11 min-w-0 cursor-pointer items-center gap-2 rounded-[var(--lms-control-radius)] px-2 text-sm text-body hover:bg-primary-subtle focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary min-[768px]:min-h-9">
    <Radio name="workspace-choice" value={item.id} checked={choice===item.id}
      onChange={()=>{setChoice(item.id);setRememberedChoice(item);}}/>
    <span className="min-w-0 flex-1 break-words">{item.title}</span>
    <StatusBadge tone={item.status==="ACTIVE"||item.status==="COMPLETED"?"success":item.status==="PLANNED"?"info":"neutral"} className="shrink-0">{item.status}</StatusBadge>
   </label>)}
   {!rows.length?<EmptyState title="No matching workspaces"
     description="No matching workspaces. Search the college directory or select another page."/>:null}
  </fieldset>
  <div className="flex min-w-0 flex-col gap-2 text-sm text-body md:flex-row md:items-center md:justify-between">
   <span role="status">{busy?"Loading workspaces…":startIndex+"–"+finish+" of "+total}</span>
   <div className="flex flex-wrap gap-2">
    <Button type="button" variant="secondary" disabled={busy||page===1}
     onClick={()=>setPage(x=>Math.max(1,x-1))}
      >Previous</Button>
    <Button type="button" variant="secondary" disabled={busy||page>=count}
     onClick={()=>setPage(x=>Math.min(count,x+1))}
      >Next</Button>
    {error?<Button type="button" variant="secondary" onClick={()=>{
       setRetryTick(n=>n+1);setError("");
     }}>Retry</Button>:null}
   </div>
  </div>
  <Button type="submit" disabled={!choice||busy||Boolean(error)} className="min-h-11 w-full md:min-h-9 md:w-auto">
   View readiness</Button>
 </form>;
}

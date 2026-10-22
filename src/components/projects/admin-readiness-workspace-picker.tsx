"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import {useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import styles from "./legacy-project-touch-actions.module.css";
type Workspace={id:string;title:string;status:string};
export function AdminReadinessWorkspacePicker({items,selected,action,collegeId,initialTotal}:{
 items:Workspace[];selected:string|null;action:string;collegeId:string;initialTotal:number;
}){

 const router=useRouter();
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
 return <form method="get" action={action} className={"min-w-0 max-w-[420px] space-y-3 "+styles['legacy']}>
  {choice?<input type="hidden" name="workspaceId" value={choice}/>:null}
  <label className="block text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
   Search workspaces by title or ID
   <Input type="search" maxLength={120} value={search}
    aria-label="Search workspaces by title or ID"
    onChange={e=>{setSearch(e.target.value);setPage(1)}}
    placeholder="Search workspaces by title or ID" className="mt-1 min-h-11 w-full md:min-h-9"/>
  </label>
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  <label className="block text-[var(--lms-font-sm)] font-semibold text-[var(--lms-neutral-400)]">
   Select a project workspace
   <Select aria-label="Select a project workspace" value={choice}
    disabled={busy||Boolean(error)} className="mt-1 min-h-11 w-full md:min-h-9"
    onChange={event=>{
     const id=event.target.value;
     setChoice(id);
     const item=rows.find(row=>row.id===id);
     if(item)setRememberedChoice(item);
     if(id)router.push(action+"?projectId="+encodeURIComponent(id));
    }}>
    <option value="">Select a project workspace</option>
    {rows.map(item=><option key={item.id} value={item.id}>
     {item.title} · {item.status} · {item.id.slice(0,8)}
    </option>)}
   </Select>
  </label>
  {!rows.length?<EmptyState title="No matching workspaces"
     description="No matching workspaces. Search the college directory or select another page."/>:null}
  <div className="flex min-w-0 flex-col gap-2 text-sm text-body md:flex-row md:items-center md:justify-between">
   <span role="status">{busy?"Loading workspaces…":startIndex+"–"+finish+" of "+total}</span>
   <div className="flex flex-wrap gap-2">
    <Button type="button" variant="secondary" disabled={busy||page===1}
     onClick={()=>setPage(x=>Math.max(1,x-1))}
      >Previous workspaces</Button>
    <Button type="button" variant="secondary" disabled={busy||page>=count}
     onClick={()=>setPage(x=>Math.min(count,x+1))}
      >Next workspaces</Button>
    {error?<Button type="button" variant="secondary" onClick={()=>{
       setRetryTick(n=>n+1);setError("");
     }}>Retry</Button>:null}
   </div>
  </div>
 </form>;
}

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Banner } from "@/components/ui/banner";

type SyllabusItem={id:string;title:string;contentType:string};
export function SuperAdminSectionSyllabusOrder({
 lessonId,lessonName,deliveryId,items,editable,
}:{
 lessonId:string;lessonName:string;deliveryId:string;items:readonly SyllabusItem[];editable:boolean;
}){
 const [ordered,setOrdered]=useState<string[]>(()=>items.map(item=>item.id));
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [success,setSuccess]=useState(false);
 const router=useRouter();
 const byId=new Map(items.map(item=>[item.id,item]));
 const changed=ordered.some((id,index)=>id!==items[index]?.id);
 function move(index:number,amount:number){
  const target=index+amount;
  if(target<0||target>=ordered.length||busy||!editable)return;
  setOrdered(previous=>{
   const next=[...previous];const first=next[index],second=next[target];
   if(!first||!second)return previous;
   next[index]=second;next[target]=first;return next;
  });
  setSuccess(false);setError("");
 }
 async function save(){
  if(busy||!editable||!changed)return;
  setBusy(true);setError("");
  try{
   const response=await fetch("/api/courses/lesson-contents/order",{
    method:"PUT",credentials:"same-origin",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({lessonId,deliveryId,orderedContentIds:ordered}),
   });
   if(!response.ok)throw new Error("The order has changed or ordering is unavailable. Refresh before trying again.");
   setSuccess(true);
   router.refresh();
  }catch(cause){
   setError(cause instanceof Error?cause.message:"Unable to save the new order.");
  }finally{setBusy(false);}
 }
 return <section className="min-w-0 space-y-3 border border-border bg-surface p-4"
   aria-label={"Syllabus order for "+lessonName}>
  <div className="flex flex-wrap items-center justify-between gap-3">
   <h3 className="font-semibold text-foreground">{lessonName}</h3>
   <span className="text-xs text-muted-foreground">{items.length} content item(s)</span>
  </div>
  <ol className="divide-y divide-border">
   {ordered.map((id,index)=>{
    const item=byId.get(id);
    if(!item)return null;
    return <li key={id} className="flex min-w-0 items-center gap-2 py-2">
     <span className="w-7 shrink-0 text-center text-sm tabular-nums">{index+1}</span>
     <span className="min-w-0 flex-1 break-words text-sm">
      <strong>{item.title}</strong>
      <span className="ml-2 text-xs text-muted-foreground">{item.contentType.replaceAll("_"," ")}</span>
     </span>
     <Button type="button" variant="secondary" size="sm"
      aria-label={"Move "+item.title+" up"} disabled={!editable||busy||index===0}
      onClick={()=>move(index,-1)}>↑</Button>
     <Button type="button" variant="secondary" size="sm"
      aria-label={"Move "+item.title+" down"} disabled={!editable||busy||index===ordered.length-1}
      onClick={()=>move(index,1)}>↓</Button>
    </li>;
   })}
  </ol>
  {error?<Banner tone="warning" role="alert">{error}</Banner>:null}
  {success?<p role="status" className="text-sm text-success">Order saved.</p>:null}
  <div className="flex flex-wrap gap-2">
   <Button type="button" onClick={()=>void save()} loading={busy} disabled={!editable||busy||!changed}>
    Save lesson order
   </Button>
   {changed?<Button type="button" variant="secondary" disabled={busy}
    onClick={()=>{setOrdered(items.map(item=>item.id));setError("");setSuccess(false);}}>Undo edits</Button>:null}
  </div>
 </section>;
}

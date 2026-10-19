"use client";
import { Button } from "@/components/ui/button";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {useToast} from "@/components/ui/toast";
import {apiFetch} from "@/lib/api-fetch";
import {rearrangeLessonIds} from "@/modules/courses/college-lesson-order-model";

type Lesson={id:string;name:string;sequence:number};
export function CollegeLessonDragOrder({learningPathId,lessons}:{
 learningPathId:string;lessons:readonly Lesson[];
}){
 const router=useRouter();
 const {showToast}=useToast();
 const [order,setOrder]=useState<string[]>(()=>lessons.map(row=>row.id));
 const [dragging,setDragging]=useState<string|null>(null);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const names=new Map(lessons.map(row=>[row.id,row.name]));
 async function move(from:string,to:string){
  if(busy||from===to)return;
  const previous=order;
  const next=rearrangeLessonIds(previous,from,to);
  if(next.every((id,index)=>id===previous[index]))return;
  setOrder(next);setError("");setBusy(true);
  try{
   await apiFetch("/api/courses/lessons/reorder-all",{
    method:"POST",credentials:"same-origin",timeoutMs:15000,
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({learningPathId,expected:lessons.map(({id,sequence})=>({id,sequence})),orderedIds:next}),
   });
   showToast({tone:"success",title:"Lesson order updated"});
   router.refresh();
  }catch(error){
   setOrder(previous);
   setError("Could not save the new lesson order. The original order has been restored.");
   showToast({tone:"error",title:"Lesson order was not saved",
    description:error instanceof Error?error.message:"Refresh and try again."});
  }finally{setBusy(false);setDragging(null);}
 }
 return <section aria-label="Reorder shared lessons" className="rounded-xl border border-border bg-surface p-4">
  <h3 className="font-semibold">Reorder Lessons</h3>
  <p className="mt-1 text-xs text-muted-foreground">Drag a lesson onto another to change its place, or use Move up and Move down. Changes affect every section sharing this offering.</p>
  <ol className="mt-3 space-y-2">
   {order.map((id,index)=><li key={id} draggable={!busy}
      onDragStart={event=>{setDragging(id);event.dataTransfer.setData("text/plain",id);}}
      onDragOver={event=>event.preventDefault()}
      onDrop={event=>{event.preventDefault();void move(dragging??event.dataTransfer.getData("text/plain"),id);}}
      onDragEnd={()=>setDragging(null)}
      className="flex flex-wrap items-center gap-3 rounded border border-border p-3">
      <span aria-hidden="true" className="cursor-grab text-muted-foreground">⠿</span>
      <span className="min-w-0 flex-1 break-words text-sm">{index+1}. {names.get(id)??"Lesson"}</span>
      <Button variant="secondary" type="button" disabled={busy||index===0} onClick={()=>void move(id,order[index-1]!)}
        >Move up</Button>
      <Button variant="secondary" type="button" disabled={busy||index===order.length-1} onClick={()=>void move(id,order[index+1]!)}
        >Move down</Button>
   </li>)}
  </ol>
  {busy?<p role="status" className="mt-2 text-sm">Saving lesson order…</p>:null}
  {error?<p role="alert" className="mt-2 text-sm text-error">{error}</p>:null}
 </section>;
}

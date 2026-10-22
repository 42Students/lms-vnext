"use client";
import { useId, useRef, useState } from "react";
import type {KeyboardEvent,PointerEvent} from "react";
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
 const expectedOrder=useRef<string[]>(items.map(item=>item.id));
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [success,setSuccess]=useState(false);
 const [grabbed,setGrabbed]=useState<string|null>(null);
 const [notice,setNotice]=useState("");
 const hintId=useId();
 const pointer=useRef<{id:string;pointerId:number;startY:number;snapshot:string[]}|null>(null);
 const beforeKeyboard=useRef<string[]|null>(null);
 const router=useRouter();
 const byId=new Map(items.map(item=>[item.id,item]));
 const changed=ordered.some((id,index)=>id!==expectedOrder.current[index]);
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

 function keyMove(event:KeyboardEvent<HTMLButtonElement>,id:string){
  if(busy||!editable)return;
  const i=ordered.indexOf(id),label=byId.get(id)?.title??"Content";
  if(i<0)return;
  if(event.key===" "||event.key==="Enter"){
   event.preventDefault();
   if(grabbed===id){
    beforeKeyboard.current=null;setGrabbed(null);setNotice(label+" dropped at position "+(i+1));
   }else{
    beforeKeyboard.current=[...ordered];setGrabbed(id);
    setNotice(label+" picked up. Use arrow keys to move, Space to drop, Escape to cancel.");
   }
  }else if(event.key==="Escape"&&grabbed===id){
   event.preventDefault();
   if(beforeKeyboard.current)setOrdered(beforeKeyboard.current);
   beforeKeyboard.current=null;setGrabbed(null);setNotice("Reordering cancelled.");
  }else if(grabbed===id&&(event.key==="ArrowDown"||event.key==="ArrowUp")){
   event.preventDefault();
   const delta=event.key==="ArrowDown"?1:-1;
   if(i+delta>=0&&i+delta<ordered.length){
    move(i,delta);setNotice(label+" position "+(i+delta+1)+" of "+ordered.length);
   }
  }
 }
 function pointerStart(event:PointerEvent<HTMLButtonElement>,id:string){
  if(busy||!editable||event.button!==0)return;
  pointer.current={id,pointerId:event.pointerId,startY:event.clientY,snapshot:[...ordered]};
  event.currentTarget.setPointerCapture(event.pointerId);
  setGrabbed(id);
 }
 function pointerMove(event:PointerEvent<HTMLButtonElement>){
  const state=pointer.current;
  if(!state||state.pointerId!==event.pointerId||busy)return;
  const height=Math.max(30,event.currentTarget.closest("li")?.getBoundingClientRect().height??48);
  const steps=Math.trunc((event.clientY-state.startY)/height);
  if(!steps)return;
  const index=ordered.indexOf(state.id);
  const target=Math.min(ordered.length-1,Math.max(0,index+steps));
  if(index===target)return;
  state.startY+=(target-index)*height;
  setOrdered(rows=>{
   const old=rows.indexOf(state.id);
   if(old<0)return rows;
   const copy=[...rows];copy.splice(old,1);copy.splice(target,0,state.id);
   return copy;
  });
  setSuccess(false);setError("");
  setNotice((byId.get(state.id)?.title??"Content")+" position "+(target+1)+" of "+ordered.length);
 }
 function pointerFinish(event:PointerEvent<HTMLButtonElement>,cancel:boolean){
  const state=pointer.current;
  if(!state||state.pointerId!==event.pointerId)return;
  pointer.current=null;
  if(cancel){setOrdered(state.snapshot);setNotice("Reordering cancelled.");}
  else setNotice((byId.get(state.id)?.title??"Content")+" dropped.");
  setGrabbed(null);
 }
 async function save(){
  if(busy||!editable||!changed)return;
  setBusy(true);setError("");
  try{
   const response=await fetch("/api/courses/lesson-contents/order",{
    method:"PUT",credentials:"same-origin",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({lessonId,deliveryId,orderedContentIds:ordered,
      expectedOrderedContentIds:expectedOrder.current}),
   });
   if(!response.ok)throw new Error("The order has changed or ordering is unavailable. Refresh before trying again.");
   expectedOrder.current=[...ordered];
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
  <p id={hintId} className="text-xs text-muted-foreground">Drag ⠿ with mouse or touch, or focus the handle and press Space to pick up, arrow keys to move, Space to drop, Escape to cancel. Up/Down buttons are available as well.</p>
  <p role="status" aria-live="polite" className="sr-only">{notice}</p>
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
     <button type="button" disabled={!editable||busy}
      aria-label={"Reorder "+item.title} aria-describedby={hintId}
      aria-pressed={grabbed===id}
      onKeyDown={event=>keyMove(event,id)}
      onPointerDown={event=>pointerStart(event,id)}
      onPointerMove={pointerMove}
      onPointerUp={event=>pointerFinish(event,false)}
      onPointerCancel={event=>pointerFinish(event,true)}
      style={{touchAction:"none"}}
      className="inline-flex min-h-11 min-w-11 cursor-grab touch-none select-none items-center justify-center rounded border border-border text-sm font-semibold text-body focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 md:min-h-9 md:min-w-9">
      <span aria-hidden="true">⠿</span>
     </button>
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

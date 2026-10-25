"use client";
import {useRef,useState,useTransition} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import {
 facultyMoveContentId,facultyContentOrderDirty,facultyContentOrderValid,
 facultyContentOrderReceiptMatches,
} from "@/modules/courses/faculty-content-order-ui-model";
import {courseApiError} from "./learner-course-api";

export type FacultyBlueprintItem={
 id:string;title:string;kind:string;description:string|null;
 status:string;href:string;reorderable:boolean;
};
function glyph(kind:string){
 if(kind==="VIDEO")return "▶";
 if(kind==="YOUTUBE")return "YT";
 if(kind==="LIVE_CLASS")return "LV";
 if(kind==="ASSIGNMENT")return "A";
 if(kind==="QUIZ")return "Q";
 if(kind==="PDF")return "PDF";
 return "▤";
}

/** The public ordering endpoint supports content items only. Assessment
 * sequences are stored elsewhere; never submit assessment IDs to this API. */
function FacultyPrototypeLessonItemsInner({items,lessonId,deliveryId,enabled}:{
 items:readonly FacultyBlueprintItem[];lessonId:string;deliveryId:string;enabled:boolean;
}){
 const router=useRouter();
 const [saving,startTransition]=useTransition();
 const content=items.filter(item=>item.reorderable);
 const [ordered,setOrdered]=useState(()=>content.map(item=>item.id));
 const baseline=useRef(content.map(item=>item.id));
 const [dragging,setDragging]=useState<string|null>(null);
 const [message,setMessage]=useState<{ok:boolean;text:string}|null>(null);
 const [outcomeUnknown,setOutcomeUnknown]=useState(false);
 const [localVersion,setLocalVersion]=useState(0);
 const byId=new Map(items.map(item=>[item.id,item] as const));
 const displayed=[...ordered.map(id=>byId.get(id)).filter((v):v is FacultyBlueprintItem=>Boolean(v)),
  ...items.filter(item=>!item.reorderable)];
 const dirty=facultyContentOrderDirty(baseline.current,ordered);
 const canChange=enabled&&!saving&&!outcomeUnknown;
 function move(from:number,to:number){
  if(!canChange||from===to||to<0||to>=ordered.length)return;
  setOrdered(existing=>{
   if(Math.abs(from-to)===1)return facultyMoveContentId(existing,from,to-from);
   const copy=[...existing];
   const [taken]=copy.splice(from,1);
   if(!taken)return existing;
   copy.splice(to,0,taken);
   return copy;
  });
  setMessage(null);
 }
 function save(){
  if(!canChange||!dirty)return;
  if(!facultyContentOrderValid(baseline.current,ordered)){
   setMessage({ok:false,text:"The lesson content changed. Refresh the class before changing its order."});
   setOutcomeUnknown(true);
   return;
  }
  startTransition(async()=>{
   try{
    const response=await fetch("/api/courses/lesson-contents/order",{
     method:"PUT",headers:{"Content-Type":"application/json"},
     body:JSON.stringify({
      lessonId,deliveryId,orderedContentIds:ordered,
      expectedOrderedContentIds:baseline.current,
     }),
    });
    if(!response.ok)throw new Error(await courseApiError(response));
    const receipt:unknown=await response.json().catch(()=>null);
    if(!facultyContentOrderReceiptMatches(deliveryId,ordered,receipt)){
     setOutcomeUnknown(true);
     throw new Error("The save result could not be confirmed. Refresh the class before retrying.");
    }
    baseline.current=[...ordered];
    setLocalVersion(n=>n+1);
    setMessage({ok:true,text:"Lesson content order saved for this class."});
    router.refresh();
   }catch(error){
    setMessage({ok:false,text:error instanceof Error?error.message:"Content order could not be saved."});
   }
  });
 }
 return <div className="px-5 py-4">
  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
   <p className="faculty-proto-subtitle">
    {enabled?"Drag a content handle to reorder for this class. Assignments and quizzes retain their own ordering.":
     "Content ordering is not enabled for this class. Open the advanced editor for available tools."}
   </p>
   {dirty?<div className="flex flex-wrap gap-2">
    <button type="button" className="faculty-proto-secondary" onClick={()=>{
     setOrdered([...baseline.current]);setMessage(null);
    }} disabled={saving}>Reset</button>
    <button type="button" className="faculty-proto-action" onClick={save}
     disabled={!canChange}>{saving?"Saving…":"Save order"}</button>
   </div>:null}
  </div>
  {message?<p role={message.ok?"status":"alert"} className={"mb-3 rounded-lg p-3 text-sm "+
   (message.ok?"bg-green-50 text-green-800":"bg-red-50 text-red-800")}>{message.text}</p>:null}
  {outcomeUnknown?<button type="button" className="faculty-proto-secondary mb-3"
   onClick={()=>router.refresh()}>Refresh lesson before retrying</button>:null}
  <ol key={localVersion} className="divide-y divide-[#edf1f5]" aria-label="Lesson content order">
   {displayed.map(item=>{
    const idx=item.reorderable?ordered.indexOf(item.id):-1;
    const movable=item.reorderable&&canChange;
    return <li key={item.id} draggable={movable}
     onDragStart={event=>{
      if(!movable){event.preventDefault();return;}
      event.dataTransfer.effectAllowed="move";
      event.dataTransfer.setData("text/plain",item.id);
      setDragging(item.id);
     }}
     onDragOver={event=>{
      if(!movable||dragging===null||dragging===item.id)return;
      event.preventDefault();event.dataTransfer.dropEffect="move";
     }}
     onDrop={event=>{
      event.preventDefault();
      const from=ordered.indexOf(dragging??"");
      if(from>=0&&idx>=0)move(from,idx);
      setDragging(null);
     }}
     onDragEnd={()=>setDragging(null)}
     className={"flex min-w-0 items-center gap-3 py-3 "+
      (dragging===item.id?"opacity-50":"")}>
     <div className="flex w-8 shrink-0 flex-col items-center">
      {movable?<span className="text-[#60718b]" title="Drag to reorder">⠿</span>:
       <span aria-hidden="true" className="text-[#a1aebc]">·</span>}
      {item.reorderable?<div className="flex gap-1">
       <button type="button" disabled={!movable||idx===0} onClick={()=>move(idx,idx-1)}
        aria-label={"Move "+item.title+" up"} className="min-h-8 min-w-7 text-xs text-[#078191] disabled:opacity-30">↑</button>
       <button type="button" disabled={!movable||idx===ordered.length-1} onClick={()=>move(idx,idx+1)}
        aria-label={"Move "+item.title+" down"} className="min-h-8 min-w-7 text-xs text-[#078191] disabled:opacity-30">↓</button>
      </div>:null}
     </div>
     <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#eef7f9] text-xs font-bold text-[#078191]">{glyph(item.kind)}</span>
     <span className="min-w-0 flex-1">
      <Link className="block text-sm font-bold text-[#1d293f] hover:underline"
       href={item.href}>{item.title}</Link>
      <span className="faculty-proto-subtitle">{item.description??item.kind.replaceAll("_"," ").toLowerCase()}</span>
     </span>
     <span className={"shrink-0 rounded-full px-2 py-1 text-xs font-semibold "+
       (item.status==="PUBLISHED"?"bg-emerald-50 text-emerald-700":"bg-amber-50 text-amber-800")}>
      {item.status==="PUBLISHED"?"Live":item.status==="DRAFT"?"Draft":item.status}</span>
    </li>;
   })}
  </ol>
  {!items.length?<p className="faculty-proto-subtitle">This lesson has no items yet.</p>:null}
 </div>;
}
export function FacultyPrototypeLessonItems(props:Parameters<typeof FacultyPrototypeLessonItemsInner>[0]){
 const key=[props.deliveryId,props.lessonId,
  ...props.items.filter(item=>item.reorderable).map(item=>item.id)].join(":");
 return <FacultyPrototypeLessonItemsInner {...props} key={key}/>;
}

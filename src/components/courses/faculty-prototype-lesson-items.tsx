"use client";
import {useRef,useState,useTransition} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import {FacultyPrototypeBlueprintRowActions,type FacultyBlueprintRowEditor} from "./faculty-prototype-blueprint-row-actions";
import {
 facultyMoveContentId,facultyContentOrderDirty,facultyContentOrderValid,
 facultyContentOrderReceiptMatches,
} from "@/modules/courses/faculty-content-order-ui-model";
import {courseApiError} from "./learner-course-api";
import {facultyBlueprintWriteNeedsReload} from "@/modules/courses/faculty-blueprint-write-recovery";
import {facultyBlueprintFullContentOrder} from "@/modules/courses/faculty-blueprint-full-content-order";

export type FacultyBlueprintItem={
 id:string;title:string;kind:string;description:string|null;
 status:string;href:string;reorderable:boolean;sequence:number;
 editor?:FacultyBlueprintRowEditor|null;
 /** True for both shared and Section-owned content; false for assessments. */
 contentOrderMember?:boolean;
 scheduled?:boolean;
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
 const fullContent=items.filter(item=>item.contentOrderMember);
 const fullBaseline=useRef(fullContent.map(item=>item.id));
 const [ordered,setOrdered]=useState(()=>content.map(item=>item.id));
 const baseline=useRef(content.map(item=>item.id));
 const [dragging,setDragging]=useState<string|null>(null);
 const [message,setMessage]=useState<{ok:boolean;text:string}|null>(null);
 const [outcomeUnknown,setOutcomeUnknown]=useState(false);
 const [localVersion,setLocalVersion]=useState(0);
 const byId=new Map(items.map(item=>[item.id,item] as const));
 // Reorder only delivery-owned content in its own slots. Shared materials,
 // assignments and quizzes keep their authoritative positions in the lesson.
 let orderPosition=0;
 const displayed=items.map(item=>item.reorderable?
  byId.get(ordered[orderPosition++]??"")??item:item);
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
   let status:number|null=null;
   try{
    const response=await fetch("/api/courses/lesson-contents/order",{
     method:"PUT",headers:{"Content-Type":"application/json"},
     body:JSON.stringify({
      lessonId,deliveryId,
      orderedContentIds:facultyBlueprintFullContentOrder(fullContent,ordered),
      expectedOrderedContentIds:fullBaseline.current,
     }),
    });
    status=response.status;
    if(!response.ok){
     if(facultyBlueprintWriteNeedsReload(status))setOutcomeUnknown(true);
     throw new Error(await courseApiError(response));
    }
    const receipt:unknown=await response.json().catch(()=>null);
    const fullOrder=facultyBlueprintFullContentOrder(fullContent,ordered);
    if(!facultyContentOrderReceiptMatches(deliveryId,fullOrder,receipt)){
     setOutcomeUnknown(true);
     throw new Error("The save result could not be confirmed. Refresh the class before retrying.");
    }
    baseline.current=[...ordered];
    fullBaseline.current=fullOrder;
    setLocalVersion(n=>n+1);
    setMessage({ok:true,text:"Lesson content order saved for this class."});
    router.refresh();
   }catch(error){
    // No HTTP response may mean the server saved despite a broken connection.
    if(facultyBlueprintWriteNeedsReload(status))setOutcomeUnknown(true);
    setMessage({ok:false,text:error instanceof Error?error.message:"Content order could not be saved."});
   }
  });
 }
 return <div className="px-5 py-4">
  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
   <p className="faculty-proto-subtitle">
    {enabled?"Drag the handle or use the arrow keys/buttons to reorder class content. Assessments have separate sequence controls.":
     "Class-only content reordering needs verified ordering support. Use the full editor for publishing and sequencing tools."}
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
   onClick={()=>window.location.reload()}>Reload lesson to verify saved order</button>:null}
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
       (item.scheduled?"bg-cyan-50 text-cyan-800":item.status==="PUBLISHED"?"bg-emerald-50 text-emerald-700":"bg-amber-50 text-amber-800")}>
      {item.scheduled?"Scheduled":item.status==="PUBLISHED"?"Live":item.status==="DRAFT"?"Draft":item.status}</span>
     <FacultyPrototypeBlueprintRowActions editor={item.editor??null} deliveryId={deliveryId}/>
    </li>;
   })}
  </ol>
  {!items.length?<p className="faculty-proto-subtitle">This lesson has no items yet.</p>:null}
 </div>;
}
export function FacultyPrototypeLessonItems(props:Parameters<typeof FacultyPrototypeLessonItemsInner>[0]){
 const key=[props.deliveryId,props.lessonId,
  // Server-side reorder with the same IDs must reset an optimistic baseline.
  ...props.items.filter(item=>item.contentOrderMember).map(item=>item.id+":"+item.sequence)].join(":");
 return <FacultyPrototypeLessonItemsInner {...props} key={key}/>;
}

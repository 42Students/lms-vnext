"use client";
import {useRef,useState,type ComponentProps} from "react";
import {useRouter} from "next/navigation";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {FacultyContentEditor} from "./faculty-content-editor";
import {FacultyAssessmentEditor} from "./faculty-assessment-editor";
import {facultyAssessmentLifecyclePayload} from "./faculty-assessment-lifecycle-model";
import {courseApiError} from "./learner-course-api";

type ContentItem=ComponentProps<typeof FacultyContentEditor>["item"];
type AssessmentItem=ComponentProps<typeof FacultyAssessmentEditor>["assessment"];
export type FacultyBlueprintRowEditor=
 |{type:"CONTENT";item:ContentItem}
 |{type:"ASSESSMENT";item:AssessmentItem};

export function FacultyPrototypeBlueprintRowActions({editor,deliveryId}:{
 editor:FacultyBlueprintRowEditor|null;deliveryId:string;
}){
 const router=useRouter();
 const [confirm,setConfirm]=useState(false);
 const [busy,setBusy]=useState(false);
 const [unknown,setUnknown]=useState(false);
 const [error,setError]=useState<string|null>(null);
 const locked=useRef(false);
 if(!editor)return null;
 const item=editor.item;
 const archivePossible=editor.type==="CONTENT"||
  (editor.item.status!=="ARCHIVED"&&(editor.item.kind==="QUIZ"||editor.item.status==="DRAFT"||editor.item.status==="PUBLISHED"));
 const route=editor.type==="CONTENT"
  ?"/api/courses/lesson-contents/"+encodeURIComponent(item.id)+"/transition"
  :"/api/courses/faculty/"+(editor.item.kind==="QUIZ"?"quizzes":"assignments")+
   "/"+encodeURIComponent(deliveryId)+"/command";
 async function archive(){
  if(locked.current||unknown)return;
  locked.current=true;setBusy(true);setError(null);
  try{
   const body=editor.type==="CONTENT"?{action:"ARCHIVE"}:
    facultyAssessmentLifecyclePayload({
     kind:editor.item.kind,id:item.id,action:"ARCHIVE",
     expectedUpdatedAt:new Date(editor.item.updatedAt).toISOString(),
    });
   const response=await fetch(route,{
    method:"POST",headers:{"Content-Type":"application/json"},
    cache:"no-store",body:JSON.stringify(body),
   });
   if(!response.ok){
    setError((await courseApiError(response))??"Could not archive this lesson item.");
    return;
   }
   const receipt:unknown=await response.json().catch(()=>null);
   if(!receipt||typeof receipt!=="object"){
    setUnknown(true);
    setError("The archive response could not be verified. Reload this class before retrying.");
    return;
   }
   setConfirm(false);
   router.refresh();
  }catch{
   setUnknown(true);
   setError("The connection ended before the archive could be verified. Reload this class to check its state.");
  }finally{
   locked.current=false;setBusy(false);
  }
 }
 return <div className="flex shrink-0 items-center gap-1.5" aria-label={"Actions for "+item.title}>
  {editor.type==="CONTENT"
   ?<FacultyContentEditor item={editor.item} compact/>
   :<FacultyAssessmentEditor assessment={editor.item} compact/>}
  {archivePossible?<button type="button"
   className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-md border border-[#dce5ee] bg-white text-lg text-[#334155] hover:border-[#c33937] hover:text-[#a12724] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#078191]"
   aria-label={"Remove "+item.title} title={"Archive "+item.title}
   disabled={busy||unknown} onClick={()=>{setError(null);setConfirm(true);}}>×</button>:null}
  <ConfirmDialog open={confirm}
   onOpenChange={open=>{if(!busy)setConfirm(open);}}
   title={"Remove "+item.title+"?"}
   description="Archive this lesson item for the assigned class? Learner work and historical records remain saved. This does not delete stored files."
   confirmLabel="Archive item" confirmVariant="danger" pending={busy}
   onConfirm={()=>void archive()}>
   {error?<p role="alert" className="text-sm text-red-700">{error}</p>:null}
  </ConfirmDialog>
  {error&&!confirm?<p role="alert" className="max-w-44 text-xs text-red-700">{error}</p>:null}
  {unknown?<button type="button" className="text-xs font-semibold text-[#078191] underline"
   onClick={()=>window.location.reload()}>Reload to verify</button>:null}
 </div>;
}

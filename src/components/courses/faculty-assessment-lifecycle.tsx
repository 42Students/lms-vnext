"use client";


import {useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {courseApiError} from "./learner-course-api";
import {
 facultyAssessmentLifecycleActions,
 facultyAssessmentLifecyclePayload,
 facultyAssessmentLifecycleWarning,
 type FacultyAssessmentLifecycleAction,
 type FacultyAssessmentLifecycleKind,
} from "./faculty-assessment-lifecycle-model";

export function FacultyAssessmentLifecycle({kind,id,deliveryId,status,updatedAt,owned}:{
 kind:FacultyAssessmentLifecycleKind;
 id:string;
 deliveryId:string;
 status:string;
 updatedAt:Date|string;
 owned:boolean;
}){
 const router=useRouter();
 const [pending,setPending]=useState<FacultyAssessmentLifecycleAction|null>(null);
 const [saved,setSaved]=useState(false);
 const [lastAction,setLastAction]=useState<FacultyAssessmentLifecycleAction|null>(null);
 const [error,setError]=useState<string|null>(null);
 const [confirmAction,setConfirmAction]=useState<FacultyAssessmentLifecycleAction|null>(null);
 const actions=facultyAssessmentLifecycleActions({kind,status,owned});
 if(!actions.length)return null;

 async function run(action:FacultyAssessmentLifecycleAction){
   if(pending||saved)return;
   setPending(action);setError(null);
   try{
     const instant=new Date(updatedAt);
     if(!Number.isFinite(instant.getTime()))throw new Error("This item has an invalid version. Refresh before retrying.");
     const route="/api/courses/faculty/"+(kind==="QUIZ"?"quizzes":"assignments")+
       "/"+encodeURIComponent(deliveryId)+"/command";
     const response=await fetch(route,{
       method:"POST",
       headers:{"Content-Type":"application/json"},
       cache:"no-store",
       body:JSON.stringify(facultyAssessmentLifecyclePayload({
         kind,id,action,expectedUpdatedAt:instant.toISOString(),
       })),
     });
     if(!response.ok){
       setError(await courseApiError(response));
       setConfirmAction(null);
       return;
     }
     setSaved(true);setLastAction(action);setConfirmAction(null);
     router.refresh();
   }catch(err){
     setError(err instanceof Error?err.message:"The assessment could not be changed. Refresh and try again.");
     setConfirmAction(null);
   }finally{setPending(null);}
 }
 return <>
 <div className="flex flex-wrap items-center gap-2" aria-label={kind+" lifecycle actions"}>
   {actions.map(action=><Button key={action} type="button" size="sm" className="min-h-11 sm:min-h-[var(--lms-control-height)]"
     variant={action==="ARCHIVE"?"ghost":"secondary"}
     disabled={pending!==null||saved}
     onClick={()=>setConfirmAction(action)}>
     {pending===action?"Saving…":action==="CLOSE"?"Close quiz":
       action==="PUBLISH"?"Publish":"Delete"}
   </Button>)}
   {saved?<span role="status" className="text-xs text-success">
     {lastAction==="ARCHIVE"?(kind==="QUIZ"?"Quiz deleted successfully.":"Assignment deleted."):"Change saved. Refreshing Section state…"}
   </span>:null}
   {error?<span role="alert" className="text-xs font-semibold text-error">{error}</span>:null}
 </div>
 <ConfirmDialog
   open={confirmAction!==null}
   onOpenChange={open=>{if(!open && pending===null)setConfirmAction(null);}}
   title={confirmAction==="ARCHIVE"?"Delete assessment":confirmAction==="CLOSE"?"Close assessment":"Publish assessment"}
   description={confirmAction===null?undefined:facultyAssessmentLifecycleWarning(kind,confirmAction)}
   confirmLabel={confirmAction==="ARCHIVE"?"Delete":confirmAction==="CLOSE"?"Close":"Publish"}
   confirmVariant={confirmAction==="ARCHIVE"?"danger":"primary"}
   pending={pending!==null}
   onConfirm={()=>{if(confirmAction)void run(confirmAction);}}
 />
 </>;
}

"use client";
import { Alert } from "@/components/ui/alert";



import {useEffect,useRef,useState} from "react";
import {useToast} from "@/components/ui/toast";
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
 const {showToast}=useToast();
 const [pending,setPending]=useState<FacultyAssessmentLifecycleAction|null>(null);
 const inFlight=useRef(false);
 const [saved,setSaved]=useState(false);
 const [lastAction,setLastAction]=useState<FacultyAssessmentLifecycleAction|null>(null);
 const [error,setError]=useState<string|null>(null);
 const [confirmAction,setConfirmAction]=useState<FacultyAssessmentLifecycleAction|null>(null);
 const actions=facultyAssessmentLifecycleActions({kind,status,owned});
 useEffect(()=>{
  if(!saved)return;
  const timer=window.setTimeout(()=>setSaved(false),2000);
  return ()=>window.clearTimeout(timer);
 },[saved]);
 if(!actions.length)return null;

 async function run(action:FacultyAssessmentLifecycleAction){
   if(pending||saved||inFlight.current)return;
   inFlight.current=true;
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
       return;
     }
     setSaved(true);setLastAction(action);setConfirmAction(null);
     showToast({tone:"success",title:action==="ARCHIVE"
       ?kind==="ASSIGNMENT"?"Assignment deleted.":"Quiz deleted successfully."
       :action==="PUBLISH"?"Assessment published.":"Assessment updated."});
     router.refresh();
   }catch(err){
     setError(err instanceof Error?err.message:"The assessment could not be changed. Refresh and try again.");
   }finally{inFlight.current=false;setPending(null);}
 }
 return <div className="min-w-0 space-y-3">
   <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center" aria-label={kind+" lifecycle actions"}>
     {actions.map(action=><Button key={action} type="button" size="md"
       className="min-h-11 w-full sm:w-auto md:min-h-[var(--lms-control-height)]"
       variant={action==="PUBLISH"?"primary":action==="ARCHIVE"?"ghost":"secondary"}
       disabled={pending!==null||saved}
       onClick={()=>{setError(null);setConfirmAction(action);}}>
       {pending===action?"Saving…":action==="CLOSE"?"Close quiz":
         action==="PUBLISH"?"Publish":"Delete"}
     </Button>)}
   </div>
   {saved?<Alert tone="success" role="status">
     {lastAction==="ARCHIVE"?(kind==="QUIZ"?"Quiz deleted successfully.":"Assignment deleted."):"Change saved. Refreshing Section state…"}
   </Alert>:null}
   {status==="DRAFT"&&kind==="ASSIGNMENT"?<p className="text-xs text-muted-foreground">
     Legacy assignments became visible immediately on creation. In vNext the builder selects
     Publish now by default; this Draft can be published to students when ready.
   </p>:null}
   {error?<Alert tone="error">{error}</Alert>:null}
 <ConfirmDialog
   open={confirmAction!==null}
   onOpenChange={open=>{if(!open && pending===null)setConfirmAction(null);}}
   title={confirmAction==="ARCHIVE"?"Delete assessment":confirmAction==="CLOSE"?"Close assessment":"Publish assessment"}
   description={confirmAction===null?undefined:facultyAssessmentLifecycleWarning(kind,confirmAction)}
   confirmLabel={confirmAction==="ARCHIVE"?"Delete":confirmAction==="CLOSE"?"Close":"Publish"}
   confirmVariant={confirmAction==="ARCHIVE"||confirmAction==="CLOSE"?"danger":"primary"}
   pending={pending!==null}
   onConfirm={()=>{if(confirmAction)void run(confirmAction);}}>
   {error?<Alert tone="error">{error}</Alert>:null}
 </ConfirmDialog>
 </div>;
}

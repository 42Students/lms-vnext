"use client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Dialog} from "@/components/ui/dialog";

import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {FacultyAssignmentMethodPicker} from "./faculty-assignment-method-picker";
import {FacultyAssignmentMaterialLinks} from "./faculty-assignment-material-links";
import {parseCollegeIstLocal} from "@/modules/courses/college-ist-datetime-model";
import {ALL_ASSIGNMENT_METHODS,normalizeAssignmentMethods,type AssignmentMethod} from "@/modules/courses/assignment-submission-methods";
type Assignment={id:string;title:string;points:number;dueAt:Date|null;status:string;
 courseName?:string;lessonName?:string;submissionCount?:number};
function istInput(value:Date|string|null){
 if(!value)return "";
 return new Intl.DateTimeFormat("sv-SE",{
  timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",
  hour:"2-digit",minute:"2-digit",hourCycle:"h23",
 }).format(new Date(value)).replace(" ","T");
}

export function CollegeAssignmentActions({assignment}:{assignment:Assignment}){
 const router=useRouter();
 const [editing,setEditing]=useState(false);
 const [expectedUpdatedAt,setExpectedUpdatedAt]=useState<string|null>(null);
 const [resourceDeliveryId,setResourceDeliveryId]=useState<string|null>(null);
 const requestLock=useRef(false);
 const [methods,setMethods]=useState<AssignmentMethod[]>(ALL_ASSIGNMENT_METHODS);
 const [methodsLoaded,setMethodsLoaded]=useState(false);
 const [methodsDirty,setMethodsDirty]=useState(false);
 const [description,setDescription]=useState("");
 const [title,setTitle]=useState(assignment.title);
 const [points,setPoints]=useState(String(assignment.points));
 const [dueAt,setDueAt]=useState(istInput(assignment.dueAt));
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const [confirmTransition,setConfirmTransition]=useState<"PUBLISH"|"ARCHIVE"|null>(null);
 const [liveSubmissionCount,setLiveSubmissionCount]=useState<number|null>(null);
 const [confirmLoading,setConfirmLoading]=useState(false);
 async function inspectDelete(){
  if(requestLock.current||busy||confirmLoading)return;
  setConfirmLoading(true);setError("");
  try{
   const response=await fetch("/api/courses/assignments/"+encodeURIComponent(assignment.id),
    {cache:"no-store"});
   const data=await response.json().catch(()=>null);
   if(!response.ok||data?.assignment?.id!==assignment.id)throw Error("Couldn't load the latest submission count. Retry.");
   const count=data.assignment.submissionCount;
   if(!Number.isInteger(count)||count<0)throw Error("Submission count is unavailable. Reload before deleting.");
   setLiveSubmissionCount(count);
   setConfirmTransition("ARCHIVE");
  }catch(cause){setError(cause instanceof Error?cause.message:"Unable to check submissions.");}
  finally{setConfirmLoading(false);}
 }
 async function command(action:"SAVE"|"PUBLISH"|"ARCHIVE"){
  if(busy||requestLock.current)return;
  let path="/api/courses/assignments/"+encodeURIComponent(assignment.id);
  let body:unknown;
  let method="POST";
  if(action==="SAVE"){
   const maxPoints=Number(points);
   if(!title.trim()||title.trim().length>255||!points.trim()||!Number.isInteger(maxPoints)||maxPoints<0||maxPoints>10000){
    setError("Enter an assignment title (1–255 characters) and points from 0 to 10000.");return;
   }
   const dueInstant=dueAt?parseCollegeIstLocal(dueAt):null;
   if(dueAt&&!dueInstant){setError("Enter a valid IST deadline.");return;}
   path=path;method="PATCH";
   if(!methodsLoaded||!expectedUpdatedAt){setError("Reload the saved assignment before editing.");return;}
   body={expectedUpdatedAt,confirmed:true,title:title.trim(),description:description.trim()||null,
    maxPoints,dueAt:dueInstant,...(methodsDirty?{allowedMethods:methods}:{})};
  }else{
   path+="/transition";body={action};
  }
  requestLock.current=true;setBusy(true);setError("");setNotice("");
  try{
   const response=await fetch(path,{method,headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
   const data=await response.json().catch(()=>null);
   if(!response.ok)throw new Error(
     data?.error==="ASSIGNMENT_HAS_SUBMISSIONS"?
      "Students have submitted this assignment. Refresh; editing is no longer allowed.":
     data?.error==="FACULTY_ASSIGNMENT_STALE_VERSION"?
      "This assignment changed while you were editing. Reopen it to avoid overwriting someone else's changes.":
     "Could not update assignment. Check the form and try again.");
   setEditing(false);setNotice(action==="SAVE"?"Assignment updated.":action==="ARCHIVE"?
    "Assignment deleted":"Assignment published.");
   router.refresh();
  }catch(cause){setError(cause instanceof Error?cause.message:"Could not update assignment.");}
  finally{requestLock.current=false;setBusy(false);}
 }
 return <div className="min-w-0 mt-2 space-y-2">
  <div className="flex flex-wrap gap-2">
   {assignment.status!=="ARCHIVED"?<Button type="button" disabled={busy}
    variant="secondary" className="min-h-11 md:min-h-9"
    aria-label={"Edit "+assignment.title} onClick={()=>void (async()=>{
      if(editing){setEditing(false);setResourceDeliveryId(null);return;}
      if(requestLock.current)return;
      setError("");setNotice("");setMethodsLoaded(false);setExpectedUpdatedAt(null);
      setResourceDeliveryId(null);
      try{
       const response=await fetch("/api/courses/assignments/"+encodeURIComponent(assignment.id),{cache:"no-store"});
       const data=await response.json().catch(()=>null);
       if(!response.ok||data?.assignment?.id!==assignment.id)throw Error(
        "Could not load assignment settings. Refresh this page and try again.");
       setTitle(data.assignment.title);setPoints(String(data.assignment.maxPoints));
       setDueAt(istInput(data.assignment.dueAt));
       if(typeof data.assignment.updatedAt!=="string"){
        setError("The assignment revision could not be verified. Reopen before saving.");return;
       }
       setExpectedUpdatedAt(data.assignment.updatedAt);
       setResourceDeliveryId(typeof data.assignment.deliveryId==="string"?data.assignment.deliveryId:null);
       if(data.assignment.hasSubmissions){
        setError("This assignment already has submissions. Editing its published instructions, due date or points is disabled.");
        return;
       }
       setDescription(data.assignment.description??"");
       setMethods(normalizeAssignmentMethods(data.assignment.allowedMethods));setMethodsDirty(false);
       setMethodsLoaded(true);setEditing(true);
      }catch(cause){setError(cause instanceof Error?cause.message:"Unable to load assignment settings.");}
    })()}>Edit</Button>:null}
   {assignment.status==="DRAFT"?<Button type="button" disabled={busy}
    variant="primary" className="min-h-11 md:min-h-9"
    aria-label={"Publish "+assignment.title} onClick={()=>setConfirmTransition("PUBLISH")}>Publish</Button>:null}
   {assignment.status!=="ARCHIVED"?<Button type="button" disabled={busy}
    variant="danger" className="min-h-11 md:min-h-9"
    aria-label={"Delete "+assignment.title} loading={confirmLoading}
    title={confirmLoading?"Checking submissions":undefined}
    onClick={()=>void inspectDelete()}>Delete</Button>:null}
  </div>
  <ConfirmDialog open={confirmTransition!==null} onOpenChange={open=>{if(!open&&!busy)setConfirmTransition(null);}}
   title={confirmTransition==="ARCHIVE"?"Delete this assignment?":"Publish assignment?"}
   description={confirmTransition==="ARCHIVE"?
    (liveSubmissionCount===null?"Submission count unavailable.":
     liveSubmissionCount+" existing student submission"+(liveSubmissionCount===1?"":"s")+". ")+
     "Existing submissions are preserved; deletion is unavailable when any exist.":
    "Publish this assignment to enrolled students?"}
   confirmLabel={confirmTransition==="ARCHIVE"?"Delete":"Publish"} confirmVariant={confirmTransition==="ARCHIVE"?"danger":"primary"}
   pending={busy} onConfirm={()=>{
    if(!confirmTransition)return;
    const next=confirmTransition;setConfirmTransition(null);void command(next);
   }}/>
  <Dialog open={editing} onOpenChange={open=>{if(!open&&!busy)setEditing(false);}}
   dismissible={!busy} className="max-w-[720px]"
   title={"Edit assignment: "+assignment.title}
   footer={<>
    <Button type="button" variant="secondary" disabled={busy} onClick={()=>setEditing(false)}>Cancel</Button>
    <Button type="button" loading={busy} disabled={busy||!methodsLoaded}
     onClick={()=>void command("SAVE")}>Save changes</Button>
   </>}>
  <div className="grid min-w-0 gap-3">
   <p className="text-xs text-muted-foreground">
    Course and lesson are assigned at creation and cannot be moved.
    Submitted work and student grades remain attached to the original lesson.
   </p>
   <div className="grid gap-3 sm:grid-cols-2">
    <label className="grid gap-1 text-[13px] font-semibold text-muted-foreground">Course
     <Input disabled value={assignment.courseName||"Assigned course (unchanged)"}/>
    </label>
    <label className="grid gap-1 text-[13px] font-semibold text-muted-foreground">Lesson
     <Input disabled value={assignment.lessonName||"Assigned lesson (unchanged)"}/>
    </label>
   </div>
   <label className="grid gap-[6px] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Title
    <Input maxLength={255} placeholder="e.g., Module 1 Project" disabled={busy} value={title} onChange={e=>setTitle(e.target.value)}
     className="min-h-11 md:min-h-9"/></label>
   <label className="grid gap-[6px] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Points
    <Input type="number" min={0} max={10000} placeholder="Enter points" disabled={busy} value={points}
     onChange={e=>setPoints(e.target.value)} className="min-h-11 md:min-h-9"/></label>
   <label className="grid gap-[6px] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Deadline (IST)
    <Input type="datetime-local" disabled={busy} value={dueAt} onChange={e=>setDueAt(e.target.value)}
     className="min-h-11 md:min-h-9"/></label>
   <label className="grid gap-[6px] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Instructions
    <Textarea value={description} disabled={busy} maxLength={10000} rows={3}
     onChange={e=>setDescription(e.target.value)} className="min-h-24"/></label>
   <FacultyAssignmentMethodPicker methods={methods} onChange={next=>{setMethods(next);setMethodsDirty(true);}} disabled={busy}/>
   {resourceDeliveryId?<FacultyAssignmentMaterialLinks key={assignment.id+":"+resourceDeliveryId}
    assignmentId={assignment.id} deliveryId={resourceDeliveryId} disabled={busy}/>:
    <p role="status" className="text-xs text-muted-foreground">Shared assignments retain their original authoring scope. Add or remove secure resource links in a Section-specific assignment; unverified file keys cannot be attached.</p>}
  </div>
  </Dialog>
  {error?<Alert tone="error">{error}</Alert>:null}
  {notice?<Alert tone="success">{notice}</Alert>:null}
 </div>;
}

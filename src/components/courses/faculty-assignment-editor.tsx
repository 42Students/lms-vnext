"use client";
import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {friendlyApiError} from "@/lib/friendly-error";
import {FacultyAssignmentMethodPicker} from "./faculty-assignment-method-picker";
import {ALL_ASSIGNMENT_METHODS,normalizeAssignmentMethods,type AssignmentMethod} from "@/modules/courses/assignment-submission-methods";
import {authoringDueInstant,authoringLocalDateTime,assignmentActionAvailable}
 from "@/modules/courses/faculty-authoring-datetime-model";
import {facultyAssignmentDraftDirty,facultyAssignmentDraftIssue,facultyAssignmentCommandReceipt,facultyAssignmentMaySubmit,facultyAssignmentConfirmationOnEdit,facultyAssignmentSwitchNeedsConfirmation,facultyAssignmentArchiveWarning,facultyAssignmentPublishIssue,facultyAssignmentCanSaveDraft} from "@/modules/courses/faculty-assignment-editor-ui-model";
type Existing={
 id:string;lessonId:string;title:string;description:string|null;dueAt:string|null;
 maxPoints:number;sequence:number;status:string;updatedAt:string;
};
export function FacultyAssignmentEditor({deliveryId,lessons,assignments,methodsEnabled=false}:{
 deliveryId:string;lessons:readonly {id:string;name:string}[];
 assignments:readonly Existing[];
 methodsEnabled?:boolean;
}){
 const router=useRouter();
 const mutationLock=useRef(false);
 const [error,setError]=useState<string|null>(null);
 const [success,setSuccess]=useState<string|null>(null);
 const [pending,setPending]=useState(false);
 const [publishNow,setPublishNow]=useState(true);
 const [selected,setSelected]=useState("");
 const [lessonId,setLessonId]=useState(lessons[0]?.id??"");
 const [title,setTitle]=useState("");
 const [description,setDescription]=useState("");
 const [dueAt,setDueAt]=useState("");
 const [maxPoints,setMaxPoints]=useState(10);
 const [,setConfirmed]=useState(false);
 const [allowedMethods,setAllowedMethods]=useState<AssignmentMethod[]>(ALL_ASSIGNMENT_METHODS);
 const [methodsDirty,setMethodsDirty]=useState(false);
 const [methodsLoaded,setMethodsLoaded]=useState(true);
 const existing=assignments.find(x=>x.id===selected);
 function choose(id:string){
  if(pending||mutationLock.current)return;
  if(facultyAssignmentSwitchNeedsConfirmation(selected,id,existing??null,{title,description,dueAt,maxPoints}) &&
     !window.confirm("Discard unsaved assignment changes and switch drafts?"))return;
  setSelected(id);const row=assignments.find(x=>x.id===id);
  setTitle(row?.title??"");setDescription(row?.description??"");
  setDueAt(authoringLocalDateTime(row?.dueAt??null));
  setMaxPoints(row?.maxPoints??10);setLessonId(row?.lessonId??lessons[0]?.id??"");
  setConfirmed(false);setError(null);setSuccess(null);
  setAllowedMethods(ALL_ASSIGNMENT_METHODS);setMethodsDirty(false);
  setMethodsLoaded(!methodsEnabled||!row);
  if(methodsEnabled&&row){
   void fetch("/api/courses/faculty/assignments/"+encodeURIComponent(deliveryId)+
     "/methods?assignmentId="+encodeURIComponent(row.id),{cache:"no-store"})
    .then(async response=>{
      if(!response.ok)throw new Error("Unable to load permitted submission methods.");
      return response.json();
    }).then(data=>{
      setAllowedMethods(normalizeAssignmentMethods(data?.methods));setMethodsLoaded(true);
    }).catch(()=>{
      setError("Unable to load permitted submission methods. Re-select this assignment to retry.");
    });
  }
 }
 async function submit(action:"CREATE"|"EDIT"|"PUBLISH"|"ARCHIVE"){
  if(!facultyAssignmentMaySubmit(pending,mutationLock.current))return;
  // The API receives confirmed:true, and Archive still has a direct confirmation.
  if(!assignmentActionAvailable(existing?.status??null,action)){
   setError("This assignment cannot perform the selected action. Reload the Section.");return;
  }
  if(action==="CREATE" || action==="EDIT"){
    const issue=facultyAssignmentDraftIssue({title,description,maxPoints});
    if(issue){setError(issue);return;}
  }
  if(action==="CREATE" && publishNow){
    const issue=facultyAssignmentPublishIssue(authoringDueInstant(dueAt),new Date());
    if(issue){setError(issue);return;}
  }
  if(action==="PUBLISH" && existing){
    const publishIssue=facultyAssignmentPublishIssue(existing.dueAt,new Date());
    if(publishIssue){setError(publishIssue);return;}
  }
  if(action==="PUBLISH" && existing && (methodsDirty||facultyAssignmentDraftDirty(existing,
    {title,description,dueAt,maxPoints}))){
    setError("Save the draft changes first. Publish uses only the last saved revision.");
    return;
  }
  if(action==="ARCHIVE" && existing &&
    !window.confirm(facultyAssignmentArchiveWarning(existing.title)))return;
  mutationLock.current=true;
  setPending(true);setError(null);setSuccess(null);
  try{
   const base={action,confirmed:true};
   const body=action==="CREATE"?{
    ...base,lessonId,sequence:Math.max(0,...assignments.filter(x=>x.lessonId===lessonId).map(x=>x.sequence+1)),
    title,description:description||null,dueAt:authoringDueInstant(dueAt),maxPoints,
    ...(methodsEnabled?{allowedMethods}:{}),
   }:action==="EDIT"?{
    ...base,assignmentId:existing?.id,expectedUpdatedAt:existing?.updatedAt,
    title,description:description||null,dueAt:authoringDueInstant(dueAt),maxPoints,
    ...(methodsEnabled&&methodsDirty?{allowedMethods}:{}),
   }:{...base,assignmentId:existing?.id,expectedUpdatedAt:existing?.updatedAt};
   const endpoint="/api/courses/faculty/assignments/"+encodeURIComponent(deliveryId)+"/command";
   const receipt=await apiFetch<unknown>(endpoint,{
    method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body),
   });
   if(!facultyAssignmentCommandReceipt(receipt,{action,deliveryId,
      assignmentId:existing?.id,title,maxPoints}))throw new Error("Assignment save status is uncertain. Reload the Section before retrying.");
   setConfirmed(false);setMethodsDirty(false);
   if(action==="CREATE" && publishNow){
     const created=(receipt as {assignment?:{id?:unknown;updatedAt?:unknown}}).assignment;
     if(typeof created?.id!=="string"||typeof created.updatedAt!=="string"){
       setError("Assignment was created as a draft. Reload before publishing it.");
     }else{
       try{
         const published=await apiFetch<unknown>(endpoint,{
           method:"POST",headers:{"Content-Type":"application/json"},
           body:JSON.stringify({action:"PUBLISH",assignmentId:created.id,
             expectedUpdatedAt:created.updatedAt,confirmed:true}),
         });
         if(!facultyAssignmentCommandReceipt(published,{action:"PUBLISH",deliveryId,
           assignmentId:created.id}))throw new Error("Assignment was saved as a draft, but publishing could not be confirmed.");
         setSuccess("Assignment created and published.");
       }catch(reason){
         setSuccess("Assignment created as a draft. Publish it when it is ready for learners.");
         setError(reason instanceof Error?reason.message:friendlyApiError({}));
       }
     }
   }else if(action==="CREATE")setSuccess("Assignment created as a draft. Publish it when it is ready for learners.");
   else setSuccess("Assignment "+action.toLowerCase()+" completed. Refresh if another author changed this Section.");
   router.refresh();
  }catch(e){setError(e instanceof Error?e.message:friendlyApiError({}));}
  finally{mutationLock.current=false;setPending(false);}
 }
 return <section className="space-y-4 rounded-xl border border-border bg-surface p-5">
  <h2 className="text-lg font-semibold">Assignment authoring</h2>
  <label className="grid gap-1 text-sm">Choose draft or create new
   <select value={selected} disabled={pending} onChange={e=>choose(e.target.value)}
    className="min-h-10 rounded border border-border p-2">
    <option value="">New assignment</option>
    {assignments.map(x=><option key={x.id} value={x.id}>{x.title} ({x.status})</option>)}
   </select>
  </label>
  {existing?<p className="text-xs text-body">Current state: {existing.status}. Published assignments can be edited until the first learner submission; archived assignments are read-only. An assignment with submissions cannot be archived.</p>:null}
  {!existing?<label className="grid gap-1 text-sm">Lesson
   <select value={lessonId} onChange={e=>{const next=e.target.value;setConfirmed(current=>facultyAssignmentConfirmationOnEdit(current,lessonId,next));setLessonId(next);}}
    className="min-h-10 rounded border border-border p-2">
    {lessons.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}
   </select></label>:null}
  <label className="grid gap-1 text-sm">Title
   <input value={title} onChange={e=>{const next=e.target.value;setConfirmed(current=>facultyAssignmentConfirmationOnEdit(current,title,next));setTitle(next);}} maxLength={255}
    className="min-h-10 rounded border border-border p-2" /></label>
  <label className="grid gap-1 text-sm">Text instructions
   <textarea value={description} onChange={e=>{const next=e.target.value;setConfirmed(current=>facultyAssignmentConfirmationOnEdit(current,description,next));setDescription(next);}}
    maxLength={10000} rows={4} className="rounded border border-border p-2" /></label>
  <label className="grid gap-1 text-sm">Due date (IST, required before publishing)
   <input type="datetime-local" value={dueAt} onChange={e=>{const next=e.target.value;setConfirmed(current=>facultyAssignmentConfirmationOnEdit(current,dueAt,next));setDueAt(next);}}
    className="min-h-10 rounded border border-border p-2" /></label>
  <label className="grid gap-1 text-sm">Maximum points
   <input type="number" min={0} max={1000} value={maxPoints}
    onChange={e=>{const next=Number(e.target.value);setConfirmed(current=>facultyAssignmentConfirmationOnEdit(current,maxPoints,next));setMaxPoints(next);}}
    className="min-h-10 rounded border border-border p-2" /></label>
  {methodsEnabled?<FacultyAssignmentMethodPicker methods={allowedMethods}
   disabled={pending||!methodsLoaded||existing?.status==="ARCHIVED"}
   onChange={next=>{setAllowedMethods(next);setMethodsDirty(true);setConfirmed(false);}}/>:null}
  {methodsEnabled&&!methodsLoaded?<p role="status" className="text-xs">Loading allowed methods…</p>:null}
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  {success?<p role="status" className="text-sm text-body">{success}</p>:null}
  <div className="flex flex-wrap gap-2">
   {!existing?<div className="flex flex-wrap items-center gap-3">
    <label className="flex min-h-10 items-center gap-2 text-sm">
      <input type="checkbox" checked={publishNow} disabled={pending}
        onChange={event=>setPublishNow(event.target.checked)}/>
      Publish now
    </label>
    <button type="button" disabled={pending||!lessonId}
    onClick={()=>void submit("CREATE")} className="rounded bg-primary px-4 py-2 text-on-primary">{publishNow?"Create and publish":"Create draft"}</button>
   </div>
   : <>
    <button type="button" disabled={!assignmentActionAvailable(existing.status,"EDIT")||pending||(!methodsDirty&&!facultyAssignmentCanSaveDraft(existing,{title,description,dueAt,maxPoints},pending,true))}
     onClick={()=>void submit("EDIT")} className="rounded border border-border px-4 py-2">Save draft</button>
    <button type="button" disabled={pending||existing.status!=="DRAFT"}
     onClick={()=>void submit("PUBLISH")} className="rounded bg-primary px-4 py-2 text-on-primary">Publish</button>
    <button type="button" disabled={pending||!assignmentActionAvailable(existing.status,"ARCHIVE")}
     onClick={()=>void submit("ARCHIVE")} className="rounded border border-border px-4 py-2">Archive</button>
   </>}
  </div>
  <p className="text-xs text-muted-foreground">No attachments. Draft edits require an unchanged version; reload after another author updates the assignment.</p>
 </section>;
}

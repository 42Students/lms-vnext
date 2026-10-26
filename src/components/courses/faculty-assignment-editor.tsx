"use client";
import { Alert } from "@/components/ui/alert";
import { LoadingState } from "@/components/ui/loading-state";

import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Dropdown} from "@/components/ui/dropdown";
import {Menu,MenuItem} from "@/components/ui/menu";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {Textarea} from "@/components/ui/textarea";
import {Checkbox} from "@/components/ui/selection-controls";
import {apiFetch} from "@/lib/api-fetch";
import {friendlyApiError} from "@/lib/friendly-error";
import {FacultyAssignmentMethodPicker} from "./faculty-assignment-method-picker";
import {FacultyAssignmentMaterialLinks} from "./faculty-assignment-material-links";
import {ALL_ASSIGNMENT_METHODS,type AssignmentMethod} from "@/modules/courses/assignment-submission-methods";
import {facultyAssignmentMethodsLoadVersion,verifiedFacultyAssignmentMethodsResponse} from "@/modules/courses/faculty-assignment-method-load-model";
import {authoringDueInstant,authoringLocalDateTime,assignmentActionAvailable}
 from "@/modules/courses/faculty-authoring-datetime-model";
import {facultyAssignmentDraftDirty,facultyAssignmentDraftIssue,facultyAssignmentCommandReceipt,facultyAssignmentMaySubmit,facultyAssignmentConfirmationOnEdit,facultyAssignmentSwitchNeedsConfirmation,facultyAssignmentArchiveWarning,facultyAssignmentPublishIssue,facultyAssignmentCanSaveDraft} from "@/modules/courses/faculty-assignment-editor-ui-model";
type Existing={
 id:string;lessonId:string;title:string;description:string|null;dueAt:string|null;
 maxPoints:number;sequence:number;status:string;updatedAt:string;
};
export function FacultyAssignmentEditor({deliveryId,lessons,assignments,methodsEnabled=false,initialLessonId=null}:{
 deliveryId:string;lessons:readonly {id:string;name:string}[];
 assignments:readonly Existing[];
 methodsEnabled?:boolean;initialLessonId?:string|null;
}){
 const router=useRouter();
 const mutationLock=useRef(false);
 const methodsLoadVersion=useRef(facultyAssignmentMethodsLoadVersion());
 const [error,setError]=useState<string|null>(null);
 const [success,setSuccess]=useState<string|null>(null);
 const [pending,setPending]=useState(false);
 const [confirmation,setConfirmation]=useState<{kind:"SWITCH";id:string}|{kind:"ARCHIVE"}|null>(null);
 const [publishNow,setPublishNow]=useState(true);
 const [selected,setSelected]=useState("");
 const defaultLessonId=lessons.find(lesson=>lesson.id===initialLessonId)?.id??lessons[0]?.id??"";
 const [lessonId,setLessonId]=useState(defaultLessonId);
 const [title,setTitle]=useState("");
 const [description,setDescription]=useState("");
 const [dueAt,setDueAt]=useState("");
 const [maxPoints,setMaxPoints]=useState(10);
 const [,setConfirmed]=useState(false);
 const [allowedMethods,setAllowedMethods]=useState<AssignmentMethod[]>(ALL_ASSIGNMENT_METHODS);
 const [methodsDirty,setMethodsDirty]=useState(false);
 const [methodsLoaded,setMethodsLoaded]=useState(true);
 const [methodsLoading,setMethodsLoading]=useState(false);
 const existing=assignments.find(x=>x.id===selected);
 function choose(id:string,confirmed=false){
  if(pending||mutationLock.current)return;
  if(facultyAssignmentSwitchNeedsConfirmation(selected,id,existing??null,{title,description,dueAt,maxPoints}) && !confirmed){
   setConfirmation({kind:"SWITCH",id});return;
  }
  const requestVersion=methodsLoadVersion.current.next();
  setSelected(id);const row=assignments.find(x=>x.id===id);
  setTitle(row?.title??"");setDescription(row?.description??"");
  setDueAt(authoringLocalDateTime(row?.dueAt??null));
  setMaxPoints(row?.maxPoints??10);setLessonId(row?.lessonId??defaultLessonId);
  setConfirmed(false);setError(null);setSuccess(null);
  setAllowedMethods(ALL_ASSIGNMENT_METHODS);setMethodsDirty(false);
  setMethodsLoaded(!methodsEnabled||!row);
  setMethodsLoading(Boolean(methodsEnabled&&row));
  if(methodsEnabled&&row){
   void fetch("/api/courses/faculty/assignments/"+encodeURIComponent(deliveryId)+
     "/methods?assignmentId="+encodeURIComponent(row.id),{cache:"no-store"})
    .then(async response=>{
      if(!response.ok)throw new Error("Unable to load permitted submission methods.");
      return response.json();
    }).then(data=>{
      if(!methodsLoadVersion.current.isCurrent(requestVersion))return;
      const confirmed=verifiedFacultyAssignmentMethodsResponse(data);
      if(!confirmed)throw new Error("Invalid assignment methods response");
      setAllowedMethods(confirmed);setMethodsLoaded(true);setMethodsLoading(false);
    }).catch(()=>{
      if(!methodsLoadVersion.current.isCurrent(requestVersion))return;
      setMethodsLoaded(false);setMethodsLoading(false);
      setError("Unable to load permitted submission methods. Re-select this assignment to retry.");
    });
  }
 }
 async function submit(action:"CREATE"|"EDIT"|"PUBLISH"|"ARCHIVE",confirmed=false){
  if(!facultyAssignmentMaySubmit(pending,mutationLock.current))return;
  // The API receives confirmed:true, and Archive still has a direct confirmation.
  if(!assignmentActionAvailable(existing?.status??null,action)){
   setError("This assignment cannot perform the selected action. Reload the Section.");return;
  }
  if(action==="EDIT" && methodsEnabled && !methodsLoaded){
    setError("Allowed methods have not loaded. Re-select this assignment to retry.");
    return;
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
  if(action==="ARCHIVE" && existing && !confirmed){setConfirmation({kind:"ARCHIVE"});return;}
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
      ...(existing ? {assignmentId:existing.id} : {}),title,maxPoints}))throw new Error("Assignment save status is uncertain. Reload the Section before retrying.");
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
 return <section className="min-w-0 space-y-[var(--lms-space-4)] max-[767px]:[&_button]:min-h-11">
  <h2 className="text-base font-semibold text-[var(--lms-heading)]">Assignment authoring</h2>
  <label className="grid max-w-2xl min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Choose draft or create new
   <Select value={selected} disabled={pending} onChange={e=>choose(e.target.value)}
    className="text-base md:text-sm">
    <option value="">New assignment</option>
    {assignments.map(x=><option key={x.id} value={x.id}>{x.title} ({x.status})</option>)}
   </Select>
  </label>
  {existing?<p className="text-xs text-body">Current state: {existing.status}. Published assignments can be edited until the first learner submission; archived assignments are read-only. An assignment with submissions cannot be archived.</p>:null}
  <div className="grid min-w-0 items-start gap-[var(--lms-space-4)] md:grid-cols-2">
  {!existing?<label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Lesson
   <Select value={lessonId} onChange={e=>{const next=e.target.value;setConfirmed(current=>facultyAssignmentConfirmationOnEdit(current,lessonId,next));setLessonId(next);}}
    className="text-base md:text-sm">
    {lessons.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}
   </Select></label>:null}
  <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 md:col-span-2 text-[var(--lms-neutral-400)]">Title
   <Input value={title} onChange={e=>{const next=e.target.value;setConfirmed(current=>facultyAssignmentConfirmationOnEdit(current,title,next));setTitle(next);}} maxLength={255}
    className="text-base md:text-sm" /></label>
  <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 md:col-span-2 text-[var(--lms-neutral-400)]">Text instructions
   <Textarea value={description} onChange={e=>{const next=e.target.value;setConfirmed(current=>facultyAssignmentConfirmationOnEdit(current,description,next));setDescription(next);}}
    maxLength={10000} rows={4} className="text-base md:text-sm" /></label>
  <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Due date (IST, required before publishing)
   <Input type="datetime-local" value={dueAt} onChange={e=>{const next=e.target.value;setConfirmed(current=>facultyAssignmentConfirmationOnEdit(current,dueAt,next));setDueAt(next);}}
    className="text-base md:text-sm" /></label>
  <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Maximum points
   <Input type="number" min={0} max={1000} value={maxPoints}
    onChange={e=>{const next=Number(e.target.value);setConfirmed(current=>facultyAssignmentConfirmationOnEdit(current,maxPoints,next));setMaxPoints(next);}}
    className="text-base md:text-sm" /></label>
  </div>
  {methodsEnabled&&methodsLoading?<LoadingState label="Loading allowed methods…" />:null}
  {error?<Alert tone="error">{error}</Alert>:null}
  {success?<Alert tone="success">{success}</Alert>:null}
  {methodsEnabled?<FacultyAssignmentMethodPicker methods={allowedMethods}
   disabled={pending||!methodsLoaded||existing?.status==="ARCHIVED"}
   onChange={next=>{setAllowedMethods(next);setMethodsDirty(true);setConfirmed(false);}}/>:null}
  <div className="flex min-w-0 flex-col items-stretch gap-[var(--lms-space-2)] border-t border-border pt-[var(--lms-space-4)] md:flex-row md:flex-wrap md:items-center md:justify-end [&_button]:w-full md:[&_button]:w-auto">
   {!existing?<div className="flex min-w-0 flex-col items-stretch gap-[var(--lms-space-3)] md:flex-row md:items-center">
    <Checkbox label="Publish now" checked={publishNow} disabled={pending}
      onChange={event=>setPublishNow(event.target.checked)} />
    <Button type="button" loading={pending} disabled={pending||!lessonId}
    onClick={()=>void submit("CREATE")} variant="primary">{publishNow?"Create and publish":"Create draft"}</Button>
   </div>
   : <>
    <Button type="button" loading={pending} disabled={!assignmentActionAvailable(existing.status,"EDIT")||pending||(!methodsDirty&&!facultyAssignmentCanSaveDraft(existing,{title,description,dueAt,maxPoints},pending,true))}
     onClick={()=>void submit("EDIT")} variant={existing.status==="DRAFT"?"secondary":"primary"}>Save draft</Button>
    {existing.status==="DRAFT"?<Button type="button" loading={pending} disabled={pending||existing.status!=="DRAFT"}
     onClick={()=>void submit("PUBLISH")} variant="primary">Publish</Button>:null}
    <Dropdown trigger="More" label="Assignment actions" align="end" mobileSheet triggerClassName="w-full md:!min-h-9">
      <Menu className="w-full min-w-0">
        <MenuItem disabled={pending||!assignmentActionAvailable(existing.status,"ARCHIVE")} onClick={()=>void submit("ARCHIVE")}>Archive</MenuItem>
      </Menu>
    </Dropdown>
   </>}
  </div>
  {existing?<FacultyAssignmentMaterialLinks key={existing.id} deliveryId={deliveryId} assignmentId={existing.id} disabled={pending||existing.status==="ARCHIVED"}/>:null}
  <p className="text-xs text-muted-foreground">Draft edits require an unchanged version; reload after another author updates the assignment.</p>
  <ConfirmDialog open={confirmation!==null} onOpenChange={open=>{if(!open&&!pending)setConfirmation(null);}}
    title={confirmation?.kind==="SWITCH"?"Discard unsaved assignment changes and switch drafts?":
      existing?facultyAssignmentArchiveWarning(existing.title):"Archive assignment?"}
    pending={pending} confirmVariant={confirmation?.kind==="ARCHIVE"||confirmation?.kind==="SWITCH"?"danger":"primary"}
    onConfirm={()=>{
      const request=confirmation;setConfirmation(null);
      if(request?.kind==="SWITCH")choose(request.id,true);
      else if(request?.kind==="ARCHIVE")void submit("ARCHIVE",true);
    }} />
 </section>;
}

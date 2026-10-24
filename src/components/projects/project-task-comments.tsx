"use client";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Textarea} from "@/components/ui/textarea";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {useProjectEditorDiscardGuard} from "./project-editor-discard-guard";
import {projectMutation} from "./project-api";
import {PROJECT_TASK_COMMENT_KINDS,PROJECT_TASK_COMMENT_KIND_LABELS,
 type ProjectTaskCommentKind,projectTaskActivityLabel} from "@/modules/projects/task-comment-kind-staged";
type Comment={id:string;body:string;commentKind:string;createdAt:string;
 authorMembershipId:string;authorName:string|null;progressValue:number|null;
 taskStatusSnapshot:string|null};
export function ProjectTaskComments({projectId,taskId,updatedAt,canPost,blockerReply=false}:{
 projectId:string;taskId:string;updatedAt:string;canPost:boolean;
 blockerReply?:boolean;
}){
 const router=useRouter();
 const [rows,setRows]=useState<Comment[]>([]);const [body,setBody]=useState("");
 const [open,setOpen]=useState(false);
 const [kind,setKind]=useState<ProjectTaskCommentKind>("NOTE");
 const [progressDraft,setProgressDraft]=useState("");
 const [filter,setFilter]=useState<ProjectTaskCommentKind|"ALL">("ALL");
 const [busy,setBusy]=useState(false);const [error,setError]=useState<string|null>(null);
 const [lastPosted,setLastPosted]=useState<{taskId:string;updatedAt:string}|null>(null);
 const discard=useProjectEditorDiscardGuard(open,Boolean(body.trim()||progressDraft),busy,()=>{
   setBody("");setProgressDraft("");setOpen(false);setError(null);
 });
 const currentToken=lastPosted?.taskId===taskId&&Date.parse(lastPosted.updatedAt)>Date.parse(updatedAt)
   ? lastPosted.updatedAt : updatedAt;
 const url="/api/projects/"+encodeURIComponent(projectId)+"/tasks/"+encodeURIComponent(taskId)+"/comments";
 async function show(){
  setOpen(true);
  setBusy(true);setError(null);
  try{
   const result=await fetch(url,{cache:"no-store",credentials:"same-origin"});
   if(!result.ok)throw new Error("Could not load comments");
   const data=await result.json() as {comments:Comment[]};
   setRows([...data.comments].sort((left,right)=>
     Date.parse(right.createdAt)-Date.parse(left.createdAt)||right.id.localeCompare(left.id)));
  }catch(caught){setError(caught instanceof Error?caught.message:"Could not load comments");}
  finally{setBusy(false);}
 }
 useEffect(()=>{void show();},[projectId,taskId]);
 async function post(){
  if(!body.trim()){setError("Add a note before posting");return;}
  const progress=progressDraft.trim()===""?null:Number(progressDraft);
  if(kind==="PROGRESS_UPDATE"&&progress!==null&&
    (!Number.isInteger(progress)||progress<0||progress>100)){
    setError("Progress must be a whole percentage from 0 to 100");return;
  }
  setBusy(true);setError(null);
  try{
   const result=await projectMutation(url,"POST",{
     body:body.trim(),commentKind:kind,expectedTaskUpdatedAt:currentToken,
     ...(kind==="PROGRESS_UPDATE"&&progress!==null?{progressValue:progress}:{}),
   }) as {comment:{updatedTaskAt?:string|Date}};
   const nextToken=result.comment.updatedTaskAt;
   if(nextToken)setLastPosted({taskId,updatedAt:new Date(nextToken).toISOString()});
   setBody("");setProgressDraft("");setKind("NOTE");await show();router.refresh();
  }catch(caught){setError(caught instanceof Error?caught.message:"Could not add comment");}
  finally{setBusy(false);}
 }
 return <div className="mt-[var(--lms-space-2)] min-w-0 space-y-[var(--lms-space-3)]">
   {canPost&&blockerReply?<Button size="sm" variant="secondary" type="button"
      disabled={busy} onClick={()=>{
        setKind("NOTE");setBody("Suggested workaround: ");
        void show();
      }}>Reply with a way round it</Button>:null}
   <Button size="sm" variant="secondary" aria-expanded={open}
    aria-controls={"project-task-comments-"+taskId}
    onClick={()=>open?discard.requestClose():void show()}>
     Comments
   </Button>
   {open?<div id={"project-task-comments-"+taskId} role="region" aria-label="Task comments"
     className="space-y-[var(--lms-space-2)] border-b border-[var(--lms-canvas-border)] py-[var(--lms-space-3)]">
     <p className="text-xs text-muted-foreground leading-[20px]">Task activity timeline with notes and progress updates.</p>
     <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Filter comments
       <Select value={filter} onChange={event=>setFilter(event.target.value as typeof filter)}
         className="w-full">
         <option value="ALL">All comments</option>
         {PROJECT_TASK_COMMENT_KINDS.map(value=><option key={value} value={value}>
           {PROJECT_TASK_COMMENT_KIND_LABELS[value]}
         </option>)}
       </Select>
     </label>
     {rows.length===0?<p role="status" className="text-sm text-muted-foreground leading-[22px]">No comments yet.</p>:null}
     {rows.length>0&&!rows.some(row=>filter==="ALL"||row.commentKind===filter)?
       <p role="status" className="text-sm text-muted-foreground leading-[22px]">No comments match this filter.</p>:null}
     {rows.filter(row=>filter==="ALL"||row.commentKind===filter).map(row=><article key={row.id} className="border-b border-[var(--lms-canvas-border)] py-[var(--lms-space-3)] text-sm text-body last:border-b-0">
      <p className="mb-1 text-xs font-semibold text-muted-foreground leading-[20px]">
        {row.authorName || "Unknown"} · {new Intl.DateTimeFormat("en-IN", {
          dateStyle: "medium",timeStyle: "short",timeZone: "Asia/Kolkata",
        }).format(new Date(row.createdAt))}
      </p>
      <p className="mb-1 text-xs font-semibold text-body leading-[20px]">
        <span aria-hidden="true">{row.commentKind==="PROGRESS_UPDATE"?"Progress:":
          row.commentKind==="FLAG_FOR_MENTOR"?"Flag:":"Activity:"}</span>{" "}
        {projectTaskActivityLabel(row.commentKind)}
      </p>
      <p className="whitespace-pre-wrap">{row.body}</p>
      {row.taskStatusSnapshot||row.progressValue!==null?
        <p className="mt-1 text-xs text-muted-foreground">
         {row.taskStatusSnapshot?"Task state: "+row.taskStatusSnapshot.replaceAll("_"," "):""}
         {row.progressValue!==null?" · Progress "+row.progressValue+"%":""}
        </p>:null}
   </article>)}
     {canPost?<label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Type
       <Select value={kind} disabled={busy}
         onChange={event=>{
           const selected=event.target.value as ProjectTaskCommentKind;
           setKind(selected);if(selected!=="PROGRESS_UPDATE")setProgressDraft("");
         }}
         className="w-full">
         {PROJECT_TASK_COMMENT_KINDS.map(value=><option key={value} value={value}>
           {PROJECT_TASK_COMMENT_KIND_LABELS[value]}
         </option>)}
       </Select>
     </label>:null}
     {canPost&&kind==="PROGRESS_UPDATE"?<label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Progress percentage (optional)
       <Input type="number" min={0} max={100} step={1} inputMode="numeric"
         value={progressDraft} disabled={busy} aria-label="Progress percentage"
         placeholder="0 to 100" onChange={event=>setProgressDraft(event.target.value)}/>
     </label>:null}
     {canPost?<label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Message
       <Textarea maxLength={4000} value={body} disabled={busy}
         placeholder="Share a progress update or note..."
         onChange={e=>setBody(e.target.value)}/>
     </label>:null}
     {canPost && !body.trim() ? <p className="text-xs text-muted-foreground leading-[20px]">
       Add a note before posting
     </p> : null}
     {canPost?<Button className="w-full md:w-auto" size="sm" loading={busy} disabled={busy||!body.trim()} onClick={()=>void post()}>Post comment</Button>:null}
   </div>:null}
   {error?<p role="alert" className="text-sm text-error leading-[22px]">{error}</p>:null}
   <ConfirmDialog open={discard.discardOpen} onOpenChange={discard.setDiscardOpen}
    title="Discard unsaved comment?"
    description="The task comment you typed has not been posted."
    confirmLabel="Discard comment" pending={busy}
    onConfirm={discard.confirmDiscard}/>
 </div>;
}

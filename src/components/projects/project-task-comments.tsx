"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Textarea} from "@/components/ui/textarea";
import {Select} from "@/components/ui/select";
import {projectMutation} from "./project-api";
import {PROJECT_TASK_COMMENT_KINDS,PROJECT_TASK_COMMENT_KIND_LABELS,
 type ProjectTaskCommentKind} from "@/modules/projects/task-comment-kind-staged";
type Comment={id:string;body:string;commentKind:ProjectTaskCommentKind;createdAt:string;
 authorMembershipId:string;authorName:string|null};
export function ProjectTaskComments({projectId,taskId,updatedAt,canPost}:{
 projectId:string;taskId:string;updatedAt:string;canPost:boolean;
}){
 const router=useRouter();const [open,setOpen]=useState(false);
 const [rows,setRows]=useState<Comment[]>([]);const [body,setBody]=useState("");
 const [kind,setKind]=useState<ProjectTaskCommentKind>("NOTE");
 const [filter,setFilter]=useState<ProjectTaskCommentKind|"ALL">("ALL");
 const [busy,setBusy]=useState(false);const [error,setError]=useState<string|null>(null);
 const [lastPosted,setLastPosted]=useState<{taskId:string;updatedAt:string}|null>(null);
 const currentToken=lastPosted?.taskId===taskId&&Date.parse(lastPosted.updatedAt)>Date.parse(updatedAt)
   ? lastPosted.updatedAt : updatedAt;
 const url="/api/projects/"+encodeURIComponent(projectId)+"/tasks/"+encodeURIComponent(taskId)+"/comments";
 async function show(){
  setBusy(true);setError(null);
  try{
   const result=await fetch(url,{cache:"no-store",credentials:"same-origin"});
   if(!result.ok)throw new Error("Could not load comments");
   const data=await result.json() as {comments:Comment[]};
   setRows(data.comments);setOpen(true);
  }catch(caught){setError(caught instanceof Error?caught.message:"Could not load comments");}
  finally{setBusy(false);}
 }
 async function post(){
  if(!body.trim())return;
  setBusy(true);setError(null);
  try{
   const result=await projectMutation(url,"POST",{
     body:body.trim(),commentKind:kind,expectedTaskUpdatedAt:currentToken,
   }) as {comment:{updatedTaskAt?:string|Date}};
   const nextToken=result.comment.updatedTaskAt;
   if(nextToken)setLastPosted({taskId,updatedAt:new Date(nextToken).toISOString()});
   setBody("");setKind("NOTE");await show();router.refresh();
  }catch(caught){setError(caught instanceof Error?caught.message:"Could not add comment");}
  finally{setBusy(false);}
 }
 return <div className="mt-2 space-y-2">
   <Button size="sm" variant="secondary" onClick={()=>open?setOpen(false):void show()}>
     Comments
   </Button>
   {open?<div className="space-y-[var(--lms-space-2)] border-b border-[var(--lms-canvas-border)] py-[var(--lms-space-3)]" aria-label="Task comments">
     <p className="text-xs text-muted-foreground">Notes and progress updates people on this task have written.</p>
     <label className="block text-xs font-semibold text-body">Filter comments
       <Select value={filter} onChange={event=>setFilter(event.target.value as typeof filter)}
         className="mt-1 w-full">
         <option value="ALL">All comments</option>
         {PROJECT_TASK_COMMENT_KINDS.map(value=><option key={value} value={value}>
           {PROJECT_TASK_COMMENT_KIND_LABELS[value]}
         </option>)}
       </Select>
     </label>
     {rows.length===0?<p role="status" className="text-sm text-muted-foreground">No comments yet.</p>:null}
     {rows.length>0&&!rows.some(row=>filter==="ALL"||row.commentKind===filter)?
       <p role="status" className="text-sm text-muted-foreground">No comments match this filter.</p>:null}
     {rows.filter(row=>filter==="ALL"||row.commentKind===filter).map(row=><article key={row.id} className="border-b border-[var(--lms-canvas-border)] py-[var(--lms-space-3)] text-sm text-body last:border-b-0">
      <p className="mb-1 text-xs font-semibold text-muted-foreground">
        {row.authorName || "Project member"} · {new Intl.DateTimeFormat("en-IN", {
          dateStyle: "medium",timeStyle: "short",timeZone: "Asia/Kolkata",
        }).format(new Date(row.createdAt))}
      </p>
      <p className="mb-1 text-xs font-semibold text-body">
        {PROJECT_TASK_COMMENT_KIND_LABELS[row.commentKind]??"Note"}
      </p>
      <p className="whitespace-pre-wrap">{row.body}</p>
   </article>)}
     {canPost?<label className="grid gap-1 text-sm font-semibold text-body">Type
       <Select value={kind} disabled={busy}
         onChange={event=>setKind(event.target.value as ProjectTaskCommentKind)}
         className="w-full">
         {PROJECT_TASK_COMMENT_KINDS.map(value=><option key={value} value={value}>
           {PROJECT_TASK_COMMENT_KIND_LABELS[value]}
         </option>)}
       </Select>
     </label>:null}
     {canPost?<label className="grid gap-1 text-sm text-body">Message
       <Textarea maxLength={4000} value={body} disabled={busy}
         placeholder="Share a progress update or note..."
         onChange={e=>setBody(e.target.value)}/>
     </label>:null}
     {canPost && !body.trim() ? <p className="text-xs text-muted-foreground">
       Add a note before posting.
     </p> : null}
     {canPost?<Button size="sm" disabled={busy||!body.trim()} onClick={()=>void post()}>Post comment</Button>:null}
   </div>:null}
   {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
 </div>;
}

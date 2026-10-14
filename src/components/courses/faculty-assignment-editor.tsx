"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {authoringDueInstant,authoringLocalDateTime,assignmentActionAvailable}
 from "@/modules/courses/faculty-authoring-datetime-model";
type Existing={
 id:string;lessonId:string;title:string;description:string|null;dueAt:string|null;
 maxPoints:number;sequence:number;status:string;updatedAt:string;
};
export function FacultyAssignmentEditor({deliveryId,lessons,assignments}:{
 deliveryId:string;lessons:readonly {id:string;name:string}[];
 assignments:readonly Existing[];
}){
 const router=useRouter();
 const [error,setError]=useState<string|null>(null);
 const [success,setSuccess]=useState<string|null>(null);
 const [pending,setPending]=useState(false);
 const [selected,setSelected]=useState("");
 const [lessonId,setLessonId]=useState(lessons[0]?.id??"");
 const [title,setTitle]=useState("");
 const [description,setDescription]=useState("");
 const [dueAt,setDueAt]=useState("");
 const [maxPoints,setMaxPoints]=useState(10);
 const [confirmed,setConfirmed]=useState(false);
 const existing=assignments.find(x=>x.id===selected);
 function choose(id:string){
  setSelected(id);const row=assignments.find(x=>x.id===id);
  setTitle(row?.title??"");setDescription(row?.description??"");
  setDueAt(authoringLocalDateTime(row?.dueAt??null));
  setMaxPoints(row?.maxPoints??10);setLessonId(row?.lessonId??lessons[0]?.id??"");
  setConfirmed(false);setError(null);setSuccess(null);
 }
 async function submit(action:"CREATE"|"EDIT"|"PUBLISH"|"ARCHIVE"){
  if(!confirmed){setError("Confirm the selected action first.");return;}
  if(!assignmentActionAvailable(existing?.status??null,action)){
   setError("This assignment cannot perform the selected action. Reload the Section.");return;
  }
  setPending(true);setError(null);setSuccess(null);
  try{
   const base={action,confirmed:true};
   const body=action==="CREATE"?{
    ...base,lessonId,sequence:Math.max(0,...assignments.filter(x=>x.lessonId===lessonId).map(x=>x.sequence+1)),
    title,description:description||null,dueAt:authoringDueInstant(dueAt),maxPoints,
   }:action==="EDIT"?{
    ...base,assignmentId:existing?.id,expectedUpdatedAt:existing?.updatedAt,
    title,description:description||null,dueAt:authoringDueInstant(dueAt),maxPoints,
   }:{...base,assignmentId:existing?.id,expectedUpdatedAt:existing?.updatedAt};
   const response=await fetch("/api/courses/faculty/assignments/"+encodeURIComponent(deliveryId)+"/command",{
    method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body),
   });
   if(!response.ok)throw new Error("Unable to save. The item may have changed; refresh and retry.");
   setConfirmed(false);setSuccess("Assignment "+action.toLowerCase()+" completed. Refresh if another author changed this Section.");router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Unable to save changes.");}
  finally{setPending(false);}
 }
 return <section className="space-y-4 rounded-xl border border-border bg-surface p-5">
  <h2 className="text-lg font-semibold">Assignment authoring</h2>
  <label className="grid gap-1 text-sm">Choose draft or create new
   <select value={selected} onChange={e=>choose(e.target.value)}
    className="min-h-10 rounded border border-border p-2">
    <option value="">New assignment</option>
    {assignments.map(x=><option key={x.id} value={x.id}>{x.title} ({x.status})</option>)}
   </select>
  </label>
  {existing?<p className="text-xs text-body">Current state: {existing.status}. Published assignments cannot be edited; archived assignments are read-only. A submitted assignment cannot be archived.</p>:null}
  {!existing?<label className="grid gap-1 text-sm">Lesson
   <select value={lessonId} onChange={e=>setLessonId(e.target.value)}
    className="min-h-10 rounded border border-border p-2">
    {lessons.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}
   </select></label>:null}
  <label className="grid gap-1 text-sm">Title
   <input value={title} onChange={e=>setTitle(e.target.value)} maxLength={255}
    className="min-h-10 rounded border border-border p-2" /></label>
  <label className="grid gap-1 text-sm">Text instructions
   <textarea value={description} onChange={e=>setDescription(e.target.value)}
    maxLength={10000} rows={4} className="rounded border border-border p-2" /></label>
  <label className="grid gap-1 text-sm">Due date (IST, optional)
   <input type="datetime-local" value={dueAt} onChange={e=>setDueAt(e.target.value)}
    className="min-h-10 rounded border border-border p-2" /></label>
  <label className="grid gap-1 text-sm">Maximum points
   <input type="number" min={1} max={10000} value={maxPoints}
    onChange={e=>setMaxPoints(Number(e.target.value))}
    className="min-h-10 rounded border border-border p-2" /></label>
  <label className="flex gap-2 text-sm">
   <input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)} />
   I confirm this Section assignment change; archive does not erase history.
  </label>
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  {success?<p role="status" className="text-sm text-body">{success}</p>:null}
  <div className="flex flex-wrap gap-2">
   {!existing?<button type="button" disabled={pending||!lessonId||!confirmed}
    onClick={()=>void submit("CREATE")} className="rounded bg-primary px-4 py-2 text-on-primary">Create draft</button>
   : <>
    <button type="button" disabled={pending||!confirmed||existing.status!=="DRAFT"}
     onClick={()=>void submit("EDIT")} className="rounded border border-border px-4 py-2">Save draft</button>
    <button type="button" disabled={pending||!confirmed||existing.status!=="DRAFT"}
     onClick={()=>void submit("PUBLISH")} className="rounded bg-primary px-4 py-2 text-on-primary">Publish</button>
    <button type="button" disabled={pending||!confirmed||!assignmentActionAvailable(existing.status,"ARCHIVE")}
     onClick={()=>void submit("ARCHIVE")} className="rounded border border-border px-4 py-2">Archive</button>
   </>}
  </div>
  <p className="text-xs text-muted-foreground">No attachments. Draft edits require an unchanged version; reload after another author updates the assignment.</p>
 </section>;
}

"use client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {FacultyAssignmentMethodPicker} from "./faculty-assignment-method-picker";
import {ALL_ASSIGNMENT_METHODS,normalizeAssignmentMethods,type AssignmentMethod} from "@/modules/courses/assignment-submission-methods";
type Assignment={id:string;title:string;points:number;dueAt:Date|null;status:string};
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
 async function command(action:"SAVE"|"PUBLISH"|"ARCHIVE"){
  if(busy)return;
  let path="/api/courses/assignments/"+encodeURIComponent(assignment.id);
  let body:unknown;
  let method="POST";
  if(action==="SAVE"){
   const maxPoints=Number(points);
   if(!title.trim()||!Number.isInteger(maxPoints)||maxPoints<1||maxPoints>10000){
    setError("Enter a title and points from 1 to 10000.");return;
   }
   const due=dueAt?new Date(dueAt+":00+05:30"):null;
   if(due&&Number.isNaN(due.getTime())){setError("Enter a valid deadline.");return;}
   path=path;method="PATCH";
   if(!methodsLoaded||!expectedUpdatedAt){setError("Reload the saved assignment before editing.");return;}
   body={expectedUpdatedAt,confirmed:true,title:title.trim(),description:description.trim()||null,
    maxPoints,dueAt:due?.toISOString()??null,...(methodsDirty?{allowedMethods:methods}:{})};
  }else{
   const question=action==="ARCHIVE"?
    "Delete this assignment? Existing submissions must be preserved and will block deletion.":
    "Publish this assignment to enrolled students?";
   if(!window.confirm(question))return;
   path+="/transition";body={action};
  }
  setBusy(true);setError("");setNotice("");
  try{
   const response=await fetch(path,{method,headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
   const data=await response.json().catch(()=>null);
   if(!response.ok)throw new Error(
     data?.error==="ASSIGNMENT_HAS_SUBMISSIONS"?
      "Students have submitted this assignment. Refresh; editing is no longer allowed.":
     data?.error==="FACULTY_ASSIGNMENT_STALE_VERSION"?
      "Another author edited the assignment. Close this form and reopen it before saving.":
     "Could not update assignment. Check the form and try again.");
   setEditing(false);setNotice(action==="SAVE"?"Assignment updated.":action==="ARCHIVE"?
    "Assignment deleted.":"Assignment published.");
   router.refresh();
  }catch(cause){setError(cause instanceof Error?cause.message:"Could not update assignment.");}
  finally{setBusy(false);}
 }
 return <div className="mt-2 space-y-2">
  <div className="flex flex-wrap gap-2">
   {assignment.status!=="ARCHIVED"?<Button type="button" disabled={busy}
    className="min-h-10 rounded border border-border px-3 text-xs font-semibold text-primary-text"
    onClick={()=>void (async()=>{
      if(editing){setEditing(false);return;}
      setError("");setNotice("");setMethodsLoaded(false);setExpectedUpdatedAt(null);
      try{
       const response=await fetch("/api/courses/assignments/"+encodeURIComponent(assignment.id),{cache:"no-store"});
       const data=await response.json().catch(()=>null);
       if(!response.ok||data?.assignment?.id!==assignment.id)throw Error(
        "Could not load assignment settings. Refresh this page and try again.");
       setTitle(data.assignment.title);setPoints(String(data.assignment.maxPoints));
       setDueAt(istInput(data.assignment.dueAt));
       setExpectedUpdatedAt(data.assignment.updatedAt);
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
    className="min-h-10 rounded border border-border px-3 text-xs font-semibold text-primary-text"
    onClick={()=>void command("PUBLISH")}>Publish</Button>:null}
   {assignment.status!=="ARCHIVED"?<Button type="button" disabled={busy}
    className="min-h-10 rounded border border-border px-3 text-xs font-semibold text-error"
    onClick={()=>void command("ARCHIVE")}>Delete</Button>:null}
  </div>
  {editing?<div className="grid gap-2 rounded border border-border p-3">
   <label className="grid gap-1 text-xs font-semibold">Title
    <Input maxLength={200} disabled={busy} value={title} onChange={e=>setTitle(e.target.value)}
     className="min-h-10 rounded border border-border px-2"/></label>
   <label className="grid gap-1 text-xs font-semibold">Points
    <Input type="number" min={1} max={10000} disabled={busy} value={points}
     onChange={e=>setPoints(e.target.value)} className="min-h-10 rounded border border-border px-2"/></label>
   <label className="grid gap-1 text-xs font-semibold">Deadline (IST)
    <Input type="datetime-local" disabled={busy} value={dueAt} onChange={e=>setDueAt(e.target.value)}
     className="min-h-10 rounded border border-border px-2"/></label>
   <label className="grid gap-1 text-xs font-semibold">Instructions
    <Textarea value={description} disabled={busy} maxLength={10000} rows={3}
     onChange={e=>setDescription(e.target.value)} className="rounded border border-border p-2"/></label>
   <FacultyAssignmentMethodPicker methods={methods} onChange={next=>{setMethods(next);setMethodsDirty(true);}} disabled={busy}/>
   <Button disabled={busy} className="min-h-10 rounded bg-primary px-3 text-xs font-semibold text-on-primary"
    type="button" onClick={()=>void command("SAVE")}>{busy?"Saving…":"Save changes"}</Button>
  </div>:null}
  {error?<p role="alert" className="text-xs text-error">{error}</p>:null}
  {notice?<p role="status" className="text-xs text-success">{notice}</p>:null}
 </div>;
}

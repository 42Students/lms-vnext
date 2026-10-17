"use client";

import {useMemo,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {FacultyAssignmentMethodPicker} from "./faculty-assignment-method-picker";
import {ALL_ASSIGNMENT_METHODS,type AssignmentMethod} from "@/modules/courses/assignment-submission-methods";
type Lesson={id:string;name:string;course:string;courseCode:string;offeringId:string;nextSequence:number};
type Delivery={offeringId:string;deliveryId:string;sectionName:string;sectionCode:string};

export function CollegeAssignmentCreate({lessons,deliveries}:{
 lessons:readonly Lesson[];deliveries:readonly Delivery[];
}){
 const router=useRouter();
 const [opened,setOpened]=useState(false);
 const [lessonId,setLessonId]=useState(lessons[0]?.id??"");
 const [deliveryId,setDeliveryId]=useState("");
 const [title,setTitle]=useState("");
 const [description,setDescription]=useState("");
 const [dueAt,setDueAt]=useState("");
 const [points,setPoints]=useState("10");
 const [allowedMethods,setAllowedMethods]=useState<AssignmentMethod[]>(ALL_ASSIGNMENT_METHODS);
 const [pending,setPending]=useState(false);
 const [message,setMessage]=useState("");
 const [error,setError]=useState("");
 const lock=useRef(false);
 const chosen=lessons.find(x=>x.id===lessonId);
 const sections=useMemo(()=>deliveries.filter(d=>d.offeringId===chosen?.offeringId),
   [deliveries,chosen?.offeringId]);
 function close(){
  if(pending)return;
  if((title.trim()||description.trim()||dueAt)&&
   !window.confirm("Discard unsaved assignment changes?"))return;
  setOpened(false);
 }
 async function create(){
  if(lock.current||!chosen)return;
  const maxPoints=Number(points);
  if(!title.trim()||!Number.isInteger(maxPoints)||maxPoints<1||maxPoints>10000){
   setError("Enter an assignment title and 1–10000 points.");return;
  }
  if(chosen.nextSequence>10000){
   setError("This lesson has reached the assignment ordering limit.");return;
  }
  const delivery=sections.find(x=>x.deliveryId===deliveryId);
  if(deliveryId&&!delivery){setError("Choose a Section belonging to this course offering.");return;}
  const due=dueAt?new Date(dueAt+":00+05:30"):null;
  if(due&&Number.isNaN(due.getTime())){setError("Enter a valid deadline.");return;}
  if(!window.confirm("Create assignment as a draft? Learners cannot submit until published."))return;
  lock.current=true;setPending(true);setError("");setMessage("");
  try{
   const response=await fetch("/api/courses/assignments",{
    method:"POST",headers:{"content-type":"application/json"},
    body:JSON.stringify({lessonId:chosen.id,deliveryId:delivery?.deliveryId??null,
      title:title.trim(),description:description.trim()||null,
      dueAt:due?.toISOString()??null,maxPoints,sequence:chosen.nextSequence,allowedMethods}),
   });
   const payload=await response.json().catch(()=>null);
   if(!response.ok||!payload?.assignment?.id)throw new Error(
    typeof payload?.error==="string"?payload.error:"Could not create assignment.");
   setOpened(false);setTitle("");setDescription("");setDueAt("");setPoints("10");
   setMessage("Assignment draft created. Publish it to let learners submit.");
   router.refresh();
  }catch(cause){setError(cause instanceof Error?cause.message:"Could not create assignment.");}
  finally{lock.current=false;setPending(false);}
 }
 return <section className="space-y-3 rounded-lg border border-border bg-surface p-4">
  <div className="flex flex-wrap items-center justify-between gap-3">
   <div><h2 className="font-semibold">Assignments</h2>
    <p className="text-xs text-muted-foreground">Create a shared or Section-specific assignment draft.</p>
   </div>
   <button type="button" disabled={!lessons.length||pending}
    className="min-h-10 rounded-md border border-border px-3 text-sm font-semibold text-primary-text disabled:opacity-50"
    onClick={()=>setOpened(true)}>Create New Assignment</button>
  </div>
  {!lessons.length?<p className="text-sm text-muted-foreground">
   Create an active course offering and lesson before adding an assignment.</p>:null}
  {opened?<div className="grid gap-3 sm:grid-cols-2">
   <label className="grid gap-1 text-sm font-semibold">Course / Lesson
    <select value={lessonId} disabled={pending} onChange={e=>{setLessonId(e.target.value);setDeliveryId("");}}
     className="min-h-10 rounded border border-border bg-surface px-2">
     {lessons.map(lesson=><option key={lesson.id} value={lesson.id}>
      {lesson.courseCode} · {lesson.course} · {lesson.name}
     </option>)}
    </select></label>
   <label className="grid gap-1 text-sm font-semibold">Audience
    <select value={deliveryId} disabled={pending} onChange={e=>setDeliveryId(e.target.value)}
     className="min-h-10 rounded border border-border bg-surface px-2">
     <option value="">All currently eligible sections (shared offering)</option>
     {sections.map(section=><option key={section.deliveryId} value={section.deliveryId}>
      {section.sectionName} ({section.sectionCode})
     </option>)}
    </select></label>
   <label className="grid gap-1 text-sm font-semibold">Title
    <input required maxLength={200} value={title} disabled={pending} onChange={e=>setTitle(e.target.value)}
     className="min-h-10 rounded border border-border bg-surface px-2"/></label>
   <label className="grid gap-1 text-sm font-semibold">Points
    <input type="number" min={1} max={10000} value={points} disabled={pending}
     onChange={e=>setPoints(e.target.value)}
     className="min-h-10 rounded border border-border bg-surface px-2"/></label>
   <label className="grid gap-1 text-sm font-semibold">Deadline (IST)
    <input type="datetime-local" value={dueAt} disabled={pending}
     onChange={e=>setDueAt(e.target.value)}
     className="min-h-10 rounded border border-border bg-surface px-2"/></label>
   <label className="grid gap-1 text-sm font-semibold sm:col-span-2">Instructions
    <textarea rows={3} maxLength={10000} value={description} disabled={pending}
     onChange={e=>setDescription(e.target.value)}
     className="rounded border border-border bg-surface p-2"/></label>
   <div className="sm:col-span-2"><FacultyAssignmentMethodPicker methods={allowedMethods} onChange={setAllowedMethods} disabled={pending}/></div>
   <div className="flex flex-wrap gap-2 sm:col-span-2">
    <button type="button" disabled={pending||!title.trim()} onClick={()=>void create()}
     className="min-h-10 rounded bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-50">
     {pending?"Creating…":"Create draft"}</button>
    <button type="button" disabled={pending} onClick={close}
     className="min-h-10 rounded border border-border px-4 text-sm">Cancel</button>
   </div>
  </div>:null}
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  {message?<p role="status" className="text-sm text-success">{message}</p>:null}
 </section>;
}

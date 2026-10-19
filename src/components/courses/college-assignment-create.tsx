"use client";
import {Checkbox} from "@/components/ui/checkbox";

import {useMemo,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {Textarea} from "@/components/ui/textarea";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {FacultyAssignmentMethodPicker} from "./faculty-assignment-method-picker";
import {ALL_ASSIGNMENT_METHODS,type AssignmentMethod} from "@/modules/courses/assignment-submission-methods";
import {parseCollegeIstLocal} from "@/modules/courses/college-ist-datetime-model";
type Lesson={id:string;name:string;course:string;courseCode:string;offeringId:string;nextSequence:number};
type Delivery={offeringId:string;deliveryId:string;sectionName:string;sectionCode:string};

export function CollegeAssignmentCreate({lessons,deliveries}:{
 lessons:readonly Lesson[];deliveries:readonly Delivery[];
}){
 const router=useRouter();
 const [opened,setOpened]=useState(false);
 const [keepOpen,setKeepOpen]=useState(false);
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
 const [confirmCreate,setConfirmCreate]=useState(false),[confirmDiscard,setConfirmDiscard]=useState(false);
 const lock=useRef(false);
 const [nextOverride,setNextOverride]=useState<Record<string,number>>({});
 const chosen=lessons.find(x=>x.id===lessonId);
 const sections=useMemo(()=>deliveries.filter(d=>d.offeringId===chosen?.offeringId),
   [deliveries,chosen?.offeringId]);
 function discardDraft(){
  setOpened(false);setTitle("");setDescription("");setDueAt("");setPoints("10");
  setDeliveryId("");setAllowedMethods(ALL_ASSIGNMENT_METHODS);setError("");setConfirmDiscard(false);
 }
 function close(){
  if(pending)return;
  const dirty=Boolean(title.trim()||description.trim()||dueAt||deliveryId||points!=="10"||
   allowedMethods.length!==ALL_ASSIGNMENT_METHODS.length||
   ALL_ASSIGNMENT_METHODS.some(method=>!allowedMethods.includes(method)));
  if(dirty){setConfirmDiscard(true);return;}
  discardDraft();
 }
 async function create(){
  if(lock.current||!chosen)return;
  const maxPoints=Number(points);
  if(!title.trim()||!Number.isInteger(maxPoints)||maxPoints<1||maxPoints>10000){
   setError("Enter an assignment title and 1–10000 points.");return;
  }
  if(description.length>10000){setError("Instructions must be at most 10,000 characters.");return;}
  if(allowedMethods.length===0){setError("Select at least one allowed submission method.");return;}
  if((nextOverride[chosen.id]??chosen.nextSequence)>10000){
   setError("This lesson has reached the assignment ordering limit.");return;
  }
  const delivery=sections.find(x=>x.deliveryId===deliveryId);
  if(deliveryId&&!delivery){setError("Choose a Section belonging to this course offering.");return;}
  const dueIso=dueAt?parseCollegeIstLocal(dueAt):null;
  if(dueAt&&!dueIso){
   setError("Enter a valid deadline.");return;
  }
  lock.current=true;setPending(true);setError("");setMessage("");
  try{
   const response=await fetch("/api/courses/assignments",{
    method:"POST",headers:{"content-type":"application/json"},
    body:JSON.stringify({lessonId:chosen.id,deliveryId:delivery?.deliveryId??null,
      title:title.trim(),description:description.trim()||null,
      dueAt:dueIso,maxPoints,sequence:nextOverride[chosen.id]??chosen.nextSequence,allowedMethods}),
   });
   const payload=await response.json().catch(()=>null);
   if(!response.ok||!payload?.assignment?.id)throw new Error(
    typeof payload?.error==="string"?payload.error:"Could not create assignment.");
   setNextOverride(old=>({...old,[chosen.id]:(old[chosen.id]??chosen.nextSequence)+1}));
   setConfirmCreate(false);
   if(!keepOpen)setOpened(false);
   setTitle("");setDescription("");setDueAt("");setPoints("10");
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
   <Button type="button" variant="secondary" disabled={!lessons.length||pending}
    className="min-h-11 rounded-md border border-border px-3 text-sm font-semibold text-[var(--lms-teal-deep)] disabled:opacity-50"
    onClick={()=>{setError("");setMessage("");setOpened(true);}}>Create New Assignment</Button>
  </div>
  {!lessons.length?<p className="text-sm text-muted-foreground">
   Create an active course offering and lesson before adding an assignment.</p>:null}
  {opened?<div className="grid gap-3 sm:grid-cols-2">
   <label className="grid gap-1 text-sm font-semibold">Course / Lesson
    <Select value={lessonId} disabled={pending} onChange={e=>{setLessonId(e.target.value);setDeliveryId("");}}
     className="min-h-11 rounded border border-border bg-surface px-2">
     {lessons.map(lesson=><option key={lesson.id} value={lesson.id}>
      {lesson.courseCode} · {lesson.course} · {lesson.name}
     </option>)}
    </Select></label>
   <label className="grid gap-1 text-sm font-semibold">Audience
    <Select value={deliveryId} disabled={pending} onChange={e=>setDeliveryId(e.target.value)}
     className="min-h-11 rounded border border-border bg-surface px-2">
     <option value="">All currently eligible sections (shared offering)</option>
     {sections.map(section=><option key={section.deliveryId} value={section.deliveryId}>
      {section.sectionName} ({section.sectionCode})
     </option>)}
    </Select></label>
   <label className="grid gap-1 text-sm font-semibold">Title
    <Input required maxLength={200} value={title} disabled={pending} onChange={e=>setTitle(e.target.value)}
     className="min-h-11 rounded border border-border bg-surface px-2"/></label>
   <label className="grid gap-1 text-sm font-semibold">Points
    <Input type="number" min={1} max={10000} value={points} disabled={pending}
     onChange={e=>setPoints(e.target.value)}
     className="min-h-11 rounded border border-border bg-surface px-2"/></label>
   <label className="grid gap-1 text-sm font-semibold">Deadline (IST, optional until publishing)
    <Input type="datetime-local" value={dueAt} disabled={pending}
     onChange={e=>setDueAt(e.target.value)}
     className="min-h-11 rounded border border-border bg-surface px-2"/></label>
   <label className="grid gap-1 text-sm font-semibold sm:col-span-2">Instructions
    <Textarea rows={3} maxLength={10000} value={description} disabled={pending}
     onChange={e=>setDescription(e.target.value)}
     className="rounded border border-border bg-surface p-2"/></label>
   <p className="text-xs text-muted-foreground sm:col-span-2" role="status">Audience: {deliveryId?
    sections.find(section=>section.deliveryId===deliveryId)?.sectionName??"Invalid Section":
    "All currently eligible Sections in the selected Course Offering"}.
    Draft assignments are hidden until they are published.</p>
   <div className="sm:col-span-2"><FacultyAssignmentMethodPicker methods={allowedMethods} onChange={setAllowedMethods} disabled={pending}/></div>
   <label className="flex items-center gap-2 text-sm sm:col-span-2">
    <Checkbox checked={keepOpen} disabled={pending}
     onChange={event=>setKeepOpen(event.target.checked)}/>Create another assignment after saving
   </label>
   <div className="flex flex-wrap gap-2 sm:col-span-2">
    <Button type="button" disabled={pending||!chosen||!title.trim()} onClick={()=>setConfirmCreate(true)}
     className="min-h-11">
     {pending?"Creating…":"Create draft"}</Button>
    <Button type="button" variant="secondary" disabled={pending} onClick={close}
     className="min-h-11">Cancel</Button>
   </div>
  </div>:null}
  <ConfirmDialog open={confirmCreate} onOpenChange={setConfirmCreate}
   title="Create assignment as a draft?" description="Learners cannot submit until published."
   confirmLabel="Create draft" pending={pending} confirmDisabled={!chosen||!title.trim()} onConfirm={()=>void create()}>
   {error?<p role="alert" className="text-sm text-foreground">{error}</p>:null}
  </ConfirmDialog>
  <ConfirmDialog open={confirmDiscard} onOpenChange={setConfirmDiscard} title="Discard unsaved assignment changes?"
   description="Unsaved assignment details will be discarded." confirmLabel="Discard draft"
   confirmVariant="danger" pending={pending} onConfirm={discardDraft}/>
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  {message?<p role="status" className="text-sm text-success">{message}</p>:null}
 </section>;
}

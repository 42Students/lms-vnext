"use client";
import {Checkbox} from "@/components/ui/checkbox";

import {useMemo,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Alert} from "@/components/ui/alert";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {Textarea} from "@/components/ui/textarea";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Dialog} from "@/components/ui/dialog";
import {Disclosure} from "@/components/ui/disclosure";
import {FacultyAssignmentMethodPicker} from "./faculty-assignment-method-picker";
import {type AssignmentMethod} from "@/modules/courses/assignment-submission-methods";
const DEFAULT_ASSIGNMENT_METHODS: AssignmentMethod[] = ["WRITTEN_RESPONSE"];
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
 const [points,setPoints]=useState("0");
 const [allowedMethods,setAllowedMethods]=useState<AssignmentMethod[]>(DEFAULT_ASSIGNMENT_METHODS);
 const [pending,setPending]=useState(false);
 const [message,setMessage]=useState("");
 const [error,setError]=useState("");
 const [confirmCreate,setConfirmCreate]=useState(false),[confirmDiscard,setConfirmDiscard]=useState(false);
 const lock=useRef(false);
 const [nextOverride,setNextOverride]=useState<Record<string,number>>({});
 const chosen=lessons.find(x=>x.id===lessonId);
 const pointsValid=points.trim().length>0&&Number.isInteger(Number(points))&&Number(points)>=0&&Number(points)<=10000;
 const sections=useMemo(()=>deliveries.filter(d=>d.offeringId===chosen?.offeringId),
   [deliveries,chosen?.offeringId]);
 function discardDraft(){
  setOpened(false);setTitle("");setDescription("");setDueAt("");setPoints("0");
  setDeliveryId("");setAllowedMethods(DEFAULT_ASSIGNMENT_METHODS);setError("");setConfirmDiscard(false);
 }
 function close(){
  if(pending)return;
  const dirty=Boolean(title.trim()||description.trim()||dueAt||deliveryId||points!=="0"||
   allowedMethods.length!==DEFAULT_ASSIGNMENT_METHODS.length||
   DEFAULT_ASSIGNMENT_METHODS.some(method=>!allowedMethods.includes(method)));
  if(dirty){setConfirmDiscard(true);return;}
  discardDraft();
 }
 async function create(){
  if(lock.current||!chosen)return;
  const maxPoints=Number(points);
  if(!title.trim()||title.trim().length>255||!pointsValid||!Number.isInteger(maxPoints)){
   setError("Enter an assignment title (1–255 characters) and points from 0 to 10000.");return;
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
   setTitle("");setDescription("");setDueAt("");setPoints("0");
   setAllowedMethods(DEFAULT_ASSIGNMENT_METHODS);
   setMessage("Assignment draft created. Publish it to let learners submit.");
   router.refresh();
  }catch(cause){setError(cause instanceof Error?cause.message:"Could not create assignment.");}
  finally{lock.current=false;setPending(false);}
 }
 return <div className="min-w-0">
  <Button type="button" variant="primary" disabled={!lessons.length||pending}
   className="min-h-11 w-full md:w-auto md:min-h-9"
   onClick={()=>{setError("");setMessage("");setOpened(true);}}>
   <span aria-hidden="true">+</span>Create Assignment
  </Button>
  {!lessons.length?<p className="text-sm text-muted-foreground">
   Create an active course offering and lesson before adding an assignment.</p>:null}
  <Dialog open={opened} onOpenChange={next=>{if(!next)close();}}
   title="Create Assignment" description="Select a course, audience and assignment details."
   className="max-w-[720px]">
   <div role="region" aria-label="Create assignment draft" className="grid min-w-0 gap-3 sm:grid-cols-2">
   <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Course / Lesson
    <Select value={lessonId} disabled={pending} onChange={e=>{setLessonId(e.target.value);setDeliveryId("");}}
     className="min-h-11 w-full md:min-h-9">
     {lessons.map(lesson=><option key={lesson.id} value={lesson.id}>
      {lesson.courseCode} · {lesson.course} · {lesson.name}
     </option>)}
    </Select></label>
   <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Audience
    <Select value={deliveryId} disabled={pending} onChange={e=>setDeliveryId(e.target.value)}
     className="min-h-11 w-full md:min-h-9">
     <option value="">All currently eligible sections (shared offering)</option>
     {sections.map(section=><option key={section.deliveryId} value={section.deliveryId}>
      {section.sectionName} ({section.sectionCode})
     </option>)}
    </Select></label>
   <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Title
    <Input required maxLength={255} placeholder="e.g., Module 1 Project" value={title} disabled={pending} onChange={e=>setTitle(e.target.value)}
     className="min-h-11 w-full md:min-h-9"/></label>
   <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Points
    <Input type="number" min={0} max={10000} placeholder="Enter points" value={points} disabled={pending}
     onChange={e=>setPoints(e.target.value)}
     className="min-h-11 w-full md:min-h-9"/></label>
   <p className="text-xs text-muted-foreground sm:col-span-2" role="status">Audience: {deliveryId?
    sections.find(section=>section.deliveryId===deliveryId)?.sectionName??"Invalid Section":
    "All currently eligible Sections in the selected Course Offering"}.
    Draft assignments are hidden until they are published.</p>
   <Disclosure title="Instructions and submission settings" className="min-w-0 border-t border-border py-2 sm:col-span-2" contentClassName="pt-3">
    <div className="grid min-w-0 gap-3 sm:grid-cols-2">
   <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Deadline (IST, optional until publishing)
    <Input type="datetime-local" value={dueAt} disabled={pending}
     onChange={e=>setDueAt(e.target.value)}
     className="min-h-11 w-full md:min-h-9"/></label>
   <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 sm:col-span-2 text-[var(--lms-neutral-400)]">Instructions
    <Textarea rows={4} placeholder="What the student needs to submit" maxLength={10000} value={description} disabled={pending}
     onChange={e=>setDescription(e.target.value)}
     className="min-h-24 w-full"/></label>

   <div className="sm:col-span-2"><FacultyAssignmentMethodPicker methods={allowedMethods} onChange={setAllowedMethods} disabled={pending}/></div>
    </div>
   </Disclosure>
   <label className="flex min-h-11 min-w-0 items-center gap-2 text-sm sm:col-span-2">
    <Checkbox checked={keepOpen} disabled={pending}
     onChange={event=>setKeepOpen(event.target.checked)}/>Create another assignment after saving
   </label>
   <div className="flex min-w-0 flex-col-reverse gap-2 sm:col-span-2 sm:flex-row sm:items-center sm:justify-end">
    <Button type="button" variant="secondary" disabled={pending} onClick={close}
     className="min-h-11 w-full sm:w-auto md:min-h-9">Cancel</Button>
    <Button type="button" loading={pending} disabled={pending||!chosen||!title.trim()||!pointsValid} onClick={()=>{setError("");setConfirmCreate(true);}}
     className="min-h-11 w-full sm:w-auto md:min-h-9">
     {pending?"Creating…":"Create draft"}</Button>
   </div>
   </div>
   {error?<Alert tone="error" className="mt-3">{error}</Alert>:null}
  </Dialog>
  <ConfirmDialog open={confirmCreate} onOpenChange={next=>{if(!pending)setConfirmCreate(next);}}
   title="Create assignment as a draft?" description="Learners cannot submit until published."
   confirmLabel="Create draft" confirmVariant="primary" pending={pending} confirmDisabled={!chosen||!title.trim()||!pointsValid} onConfirm={()=>void create()}>
   {error?<Alert tone="error">{error}</Alert>:null}
  </ConfirmDialog>
  <ConfirmDialog open={confirmDiscard} onOpenChange={next=>{if(!pending)setConfirmDiscard(next);}} title="Discard unsaved assignment changes?"
   description="Unsaved assignment details will be discarded." confirmLabel="Discard draft"
   confirmVariant="danger" pending={pending} onConfirm={discardDraft}/>
  {error?<Alert tone="error">{error}</Alert>:null}
  {message?<Alert tone="success">{message}</Alert>:null}
 </div>;
}

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
import {useToast} from "@/components/ui/toast";
import {Disclosure} from "@/components/ui/disclosure";
import {FacultyAssignmentMethodPicker} from "./faculty-assignment-method-picker";
import {FacultyAssignmentMaterialLinks} from "./faculty-assignment-material-links";
import {type AssignmentMethod} from "@/modules/courses/assignment-submission-methods";
import {parseCollegeIstLocal} from "@/modules/courses/college-ist-datetime-model";
const DEFAULT_ASSIGNMENT_METHODS: AssignmentMethod[] = ["WRITTEN_RESPONSE"];
type Lesson={id:string;name:string;course:string;courseCode:string;offeringId:string;nextSequence:number};
type Delivery={offeringId:string;deliveryId:string;sectionName:string;sectionCode:string};

export function CollegeAssignmentCreate({lessons,deliveries}:{
 lessons:readonly Lesson[];deliveries:readonly Delivery[];
}){
 const router=useRouter();
 const {showToast}=useToast();
 const [opened,setOpened]=useState(false);
 const [keepOpen,setKeepOpen]=useState(false);
 const [offeringId,setOfferingId]=useState(lessons[0]?.offeringId??"");
 const [lessonId,setLessonId]=useState(lessons[0]?.id??"");
 const [audience,setAudience]=useState<"SHARED"|"SECTION">("SHARED");
 const [deliveryId,setDeliveryId]=useState("");
 const [title,setTitle]=useState("");
 const [description,setDescription]=useState("");
 const [dueAt,setDueAt]=useState("");
 const [points,setPoints]=useState("0");
 const [allowedMethods,setAllowedMethods]=useState<AssignmentMethod[]>(DEFAULT_ASSIGNMENT_METHODS);
 const [pending,setPending]=useState(false);
 const [message,setMessage]=useState("");
 const [error,setError]=useState("");
 const [fieldErrors,setFieldErrors]=useState<{course?:string;lesson?:string;section?:string;title?:string;points?:string}>({});
 const [createdResourceTarget,setCreatedResourceTarget]=useState<{id:string;deliveryId:string}|null>(null);
 const [confirmCreate,setConfirmCreate]=useState(false),[confirmDiscard,setConfirmDiscard]=useState(false);
 const lock=useRef(false);
 const [nextOverride,setNextOverride]=useState<Record<string,number>>({});
 const courses=useMemo(()=>lessons.filter((lesson,index)=>
  lessons.findIndex(candidate=>candidate.offeringId===lesson.offeringId)===index),[lessons]);
 const availableLessons=useMemo(()=>lessons.filter(lesson=>lesson.offeringId===offeringId),
  [lessons,offeringId]);
 const chosen=availableLessons.find(x=>x.id===lessonId);
 const pointsValid=points.trim().length>0&&Number.isInteger(Number(points))&&Number(points)>=0&&Number(points)<=10000;
 const sections=useMemo(()=>deliveries.filter(d=>d.offeringId===chosen?.offeringId),
   [deliveries,chosen?.offeringId]);
 function discardDraft(){
  setOpened(false);setTitle("");setDescription("");setDueAt("");setPoints("0");
  setDeliveryId("");setAudience("SHARED");setAllowedMethods(DEFAULT_ASSIGNMENT_METHODS);setError("");setFieldErrors({});setConfirmDiscard(false);
 }
 function close(){
  if(pending)return;
  const dirty=Boolean(title.trim()||description.trim()||dueAt||deliveryId||audience!=="SHARED"||points!=="0"||
   allowedMethods.length!==DEFAULT_ASSIGNMENT_METHODS.length||
   DEFAULT_ASSIGNMENT_METHODS.some(method=>!allowedMethods.includes(method)));
  if(dirty){setConfirmDiscard(true);return;}
  discardDraft();
 }
 function confirmDraft(){
  const missing: {course?:string;lesson?:string;section?:string;title?:string;points?:string} = {};
  if(!offeringId)missing.course="Select a course";
  if(!chosen)missing.lesson="Select a lesson";
  if(audience==="SECTION"&&!sections.some(section=>section.deliveryId===deliveryId))
   missing.section="Select a section";
  if(!title.trim())missing.title="Enter an assignment title";
  else if(title.trim().length>255)missing.title="Maximum 255 characters";
  if(!pointsValid)missing.points="Enter points";
  setFieldErrors(missing);
  if(Object.keys(missing).length){setError("Review the highlighted assignment fields.");return;}
  setError("");setConfirmCreate(true);
 }
 async function create(){
  if(lock.current)return;
  if(!offeringId){setError("Select a course");return;}
  if(!chosen){setError("Select a lesson");return;}
  const maxPoints=Number(points);
  if(!title.trim()||title.trim().length>255||!pointsValid||!Number.isInteger(maxPoints)){
   setError("Enter an assignment title (1–255 characters) and points from 0 to 10000.");return;
  }
  if(description.length>10000){setError("Instructions must be at most 10,000 characters.");return;}
  if(allowedMethods.length===0){setError("Select at least one allowed submission method.");return;}
  if((nextOverride[chosen.id]??chosen.nextSequence)>10000){
   setError("This lesson has reached the assignment ordering limit.");return;
  }
  const delivery=audience==="SECTION"?sections.find(x=>x.deliveryId===deliveryId):undefined;
  if(audience==="SECTION"&&!delivery){setError("Select a section");return;}
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
   // Only a persisted section-specific assignment can use the currently
   // authorized per-delivery material writer. Shared drafts remain separate.
   setCreatedResourceTarget(delivery
    ?{id:payload.assignment.id,deliveryId:delivery.deliveryId}:null);
   setConfirmCreate(false);
   if(!keepOpen)setOpened(false);
   setTitle("");setDescription("");setDueAt("");setPoints("0");
   setAllowedMethods(DEFAULT_ASSIGNMENT_METHODS);setFieldErrors({});
   setMessage("Assignment saved");
   showToast({tone:"success",title:"Assignment saved"});
   router.refresh();
  }catch(cause){setError(cause instanceof Error?cause.message:"Could not create assignment.");}
  finally{lock.current=false;setPending(false);}
 }
 return <div className="min-w-0">
  <Button type="button" variant="primary" disabled={!lessons.length||pending}
   className="min-h-11 w-full md:w-auto md:min-h-9"
   onClick={()=>{setError("");setMessage("");setOpened(true);}}>
   <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24"
     fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 5v14M5 12h14"/>
    </svg> Create Assignment
  </Button>
  {!lessons.length?<p className="text-sm text-muted-foreground">
   Create an active course offering and lesson before adding an assignment.</p>:null}
  <Dialog open={opened} onOpenChange={next=>{if(!next)close();}}
   title="Create Assignment" description="Select a course, audience and assignment details."
   className="max-w-[720px]">
   <div role="region" aria-label="Create assignment draft" className="grid min-w-0 gap-3 sm:grid-cols-2">
    <p className="text-xs font-semibold text-muted-foreground sm:col-span-2">1. Course, Lesson and Section</p>
   <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Course
    <Select value={offeringId} disabled={pending||courses.length===0} onChange={e=>{
      const next=e.target.value;setOfferingId(next);setFieldErrors(old=>({...old,course:undefined,lesson:undefined,section:undefined}));
      setLessonId(lessons.find(lesson=>lesson.offeringId===next)?.id??"");
      setDeliveryId("");setAudience("SHARED");
    }} className="min-h-11 w-full md:min-h-9">
     {courses.map(course=><option key={course.offeringId} value={course.offeringId}>
      {course.courseCode} · {course.course}
     </option>)}
    </Select>{fieldErrors.course?<span role="alert" className="text-xs text-error">{fieldErrors.course}</span>:null}</label>
   <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Lesson
    <Select value={lessonId} disabled={pending||!offeringId||availableLessons.length===0} onChange={e=>{setLessonId(e.target.value);setDeliveryId("");setAudience("SHARED");setFieldErrors(old=>({...old,lesson:undefined,section:undefined}));}}
     className="min-h-11 w-full md:min-h-9">
     {availableLessons.map(lesson=><option key={lesson.id} value={lesson.id}>{lesson.name}</option>)}
    </Select>{fieldErrors.lesson?<span role="alert" className="text-xs text-error">{fieldErrors.lesson}</span>:null}</label>
   <fieldset className="min-w-0 space-y-2 sm:col-span-2">
    <legend className="text-[13px] font-semibold text-[var(--lms-neutral-400)]">Audience</legend>
    <div className="flex flex-wrap gap-4 text-sm">
     <label className="flex items-center gap-2"><input type="radio" name="assignment-audience"
      checked={audience==="SHARED"} disabled={pending} onChange={()=>{setAudience("SHARED");setDeliveryId("");}}/>All currently eligible sections for this course</label>
     <label className="flex items-center gap-2"><input type="radio" name="assignment-audience"
      checked={audience==="SECTION"} disabled={pending||!sections.length}
      onChange={()=>{setAudience("SECTION");setDeliveryId(sections[0]?.deliveryId??"");}}/>Specific section</label>
    </div>
    <p className="text-xs text-muted-foreground">{sections.length} eligible Section(s) in this course offering</p>
   </fieldset>
   {audience==="SECTION"&&sections.length===0?<Alert tone="warning" role="alert"
      className="sm:col-span-2">Section list unavailable or no eligible sections
      for this course. Select another course, or retry sections after reloading.</Alert>:null}
   {audience==="SECTION"?<label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)] sm:col-span-2">Section
    <Select value={deliveryId} disabled={pending} onChange={e=>setDeliveryId(e.target.value)}
     className="min-h-11 w-full md:min-h-9">
     {sections.map(section=><option key={section.deliveryId} value={section.deliveryId}>
      {section.sectionName} ({section.sectionCode})
     </option>)}
    </Select>{fieldErrors.section?<span role="alert" className="text-xs text-error">{fieldErrors.section}</span>:null}</label>:null}
   <p className="border-t border-border pt-3 text-xs font-semibold text-muted-foreground sm:col-span-2">2. Assignment details</p>
   <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Title
    <Input required maxLength={255} placeholder="e.g., Module 1 Project" value={title} disabled={pending} aria-invalid={Boolean(fieldErrors.title)} onChange={e=>{setTitle(e.target.value);setFieldErrors(old=>({...old,title:undefined}));}}
     className="min-h-11 w-full md:min-h-9"/></label>
   <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Points
    <Input type="number" min={0} max={10000} placeholder="Enter points" value={points} disabled={pending} aria-invalid={Boolean(fieldErrors.points)}
     onChange={e=>{setPoints(e.target.value);setFieldErrors(old=>({...old,points:undefined}));}}
     className="min-h-11 w-full md:min-h-9"/></label>
   <p className="text-xs text-muted-foreground sm:col-span-2" role="status">Audience: {deliveryId?
    sections.find(section=>section.deliveryId===deliveryId)?.sectionName??"Invalid Section":
    "All currently eligible Sections in the selected Course Offering"}.
    Draft assignments are hidden until they are published.</p>
   <Disclosure title="Instructions and submission settings" defaultOpen className="min-w-0 border-t border-border py-2 sm:col-span-2" contentClassName="pt-3">
    <div className="grid min-w-0 gap-3 sm:grid-cols-2">
   <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Deadline (IST, optional until publishing)
    <Input type="datetime-local" value={dueAt} disabled={pending}
     aria-label="Assignment deadline in India Standard Time"
     onChange={e=>setDueAt(e.target.value)}
     className="min-h-11 w-full md:min-h-9"/></label>
   <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 sm:col-span-2 text-[var(--lms-neutral-400)]">Instructions
    <Textarea rows={4} placeholder="What the student needs to submit" maxLength={10000} value={description} disabled={pending}
     onChange={e=>setDescription(e.target.value)}
     className="min-h-24 w-full"/></label>

   <div className="sm:col-span-2"><FacultyAssignmentMethodPicker methods={allowedMethods} onChange={setAllowedMethods} disabled={pending}/></div>
    </div>
   </Disclosure>
   <p className="border-t border-border pt-3 text-xs font-semibold text-muted-foreground sm:col-span-2">3. Resources and publishing</p>
   <p className="text-xs text-body sm:col-span-2">Save the draft first. Add verified private files and HTTPS links using the resource editor before publishing. Existing uploads are never silently discarded.</p>
   <label className="flex min-h-11 min-w-0 items-center gap-2 text-sm sm:col-span-2">
    <Checkbox checked={keepOpen} disabled={pending}
     onChange={event=>setKeepOpen(event.target.checked)}/>Create another assignment after saving
   </label>
   <div className="flex min-w-0 flex-col-reverse gap-2 sm:col-span-2 sm:flex-row sm:items-center sm:justify-end">
    <Button type="button" variant="secondary" disabled={pending} onClick={close}
     className="min-h-11 w-full sm:w-auto md:min-h-9">Cancel</Button>
    <Button type="button" loading={pending} disabled={pending||!pointsValid||!title.trim()} onClick={confirmDraft}
     className="min-h-11 w-full sm:w-auto md:min-h-9">
     {pending?"Creating…":"Create draft"}</Button>
   </div>
   </div>
   {error?<Alert tone="error" className="mt-3">{error}</Alert>:null}
   {[fieldErrors.course,fieldErrors.lesson,fieldErrors.section,fieldErrors.title,fieldErrors.points].some(Boolean)
    ?<p role="status" className="mt-1 text-xs text-error">
      {[fieldErrors.course,fieldErrors.lesson,fieldErrors.section,fieldErrors.title,fieldErrors.points].filter(Boolean).join(" · ")}
     </p>:null}
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
  {createdResourceTarget?<section className="mt-4 min-w-0 space-y-2 border-t border-border pt-4" aria-label="New assignment resources">
   <div className="flex flex-wrap items-center justify-between gap-2">
    <p className="text-sm font-semibold">Instructor resources for the new Section assignment</p>
    <Button type="button" size="sm" variant="secondary" onClick={()=>setCreatedResourceTarget(null)}>Done adding resources</Button>
   </div>
   <p className="text-xs text-muted-foreground">Add secure HTTPS links before publishing. PDF and Drive files require verified private storage and cannot be saved as unverified links.</p>
   <FacultyAssignmentMaterialLinks key={createdResourceTarget.id} deliveryId={createdResourceTarget.deliveryId} assignmentId={createdResourceTarget.id}/>
  </section>:null}
 </div>;
}

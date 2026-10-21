"use client";

import {useMemo,useState} from "react";
import {useRouter} from "next/navigation";
import {Alert} from "@/components/ui/alert";
import {Button} from "@/components/ui/button";
import {Dialog} from "@/components/ui/dialog";
import {Drawer} from "@/components/ui/drawer";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {FacultyLessonAuthoring} from "./faculty-lesson-authoring";
import type {getFacultyAssessmentOverview} from "@/modules/courses/faculty-assessment-service";

type LessonChoice=Awaited<ReturnType<typeof getFacultyAssessmentOverview>>["lessonChoices"][number];
type ContextSnapshot={deliveryId:string;lessonId:string;nextSequence:number};

/** The legacy Quiz flow has a centered Course/Lesson picker followed by a
 * separate builder dialog; Assignment uses a single 640px right-hand drawer.
 * Both resolve their selected lesson against authorized Faculty teaching
 * assignments and keep it immutable while the assessment is being saved. */
export function FacultyAssessmentCreate({kind,lessons,lessonsLoadError=null}:{
 kind:"ASSIGNMENT"|"QUIZ";lessons:readonly LessonChoice[];lessonsLoadError?:string|null;
}){
 const router=useRouter();
 const [open,setOpen]=useState(false);
 const [courseKey,setCourseKey]=useState("");
 const [lessonKey,setLessonKey]=useState("");
 const [courseSearch,setCourseSearch]=useState("");
 const [lessonSearch,setLessonSearch]=useState("");
 const [continued,setContinued]=useState(false);
 const [snapshot,setSnapshot]=useState<ContextSnapshot|null>(null);
 const [error,setError]=useState<string|null>(null);
 const [draftDirty,setDraftDirty]=useState(false);
 const [editorBusy,setEditorBusy]=useState(false);
 const [discardConfirm,setDiscardConfirm]=useState(false);
 const name=kind==="QUIZ"?"Quiz":"Assignment";
 const courses=useMemo(()=>[...new Map(lessons.map(item=>[item.deliveryId,{
  deliveryId:item.deliveryId,
  name:item.courseCode+" · "+item.courseName+" · "+item.sectionName,
 }])).values()], [lessons]);
 const course=courses.find(item=>item.deliveryId===courseKey)??(courses.length===1?courses[0]:null);
 const lessonChoices=lessons.filter(item=>item.deliveryId===course?.deliveryId);
 const lesson=lessonChoices.find(item=>item.lessonId===lessonKey)??
  (lessonChoices.length===1?lessonChoices[0]:null);
 const eligibleCourses=courses.filter(row=>row.name.toLowerCase().includes(courseSearch.trim().toLowerCase()));
 const eligibleLessons=lessonChoices.filter(row=>row.lessonName.toLowerCase().includes(lessonSearch.trim().toLowerCase()));
 function chooseCourse(value:string){
  if(editorBusy)return;
  setCourseKey(value);setLessonKey("");setLessonSearch("");setError(null);
  setSnapshot(null);setDraftDirty(false);
 }
 function chooseLesson(value:string){
  if(editorBusy)return;
  setLessonKey(value);setError(null);setSnapshot(null);setDraftDirty(false);
 }
 function discardDraft(){
  setDiscardConfirm(false);setDraftDirty(false);setOpen(false);
  setContinued(false);setSnapshot(null);setError(null);setEditorBusy(false);
 }
 function requestClose(next:boolean){
  if(next){setOpen(true);return;}
  if(editorBusy){setError("An upload or save is in progress. Finish it before closing.");return;}
  if(draftDirty){setDiscardConfirm(true);return;}
  discardDraft();
 }
 function startQuizBuilder(){
  if(!course){setError("Select course");return;}
  if(!lesson){setError("Select lesson");return;}
  setSnapshot({deliveryId:course.deliveryId,lessonId:lesson.lessonId,nextSequence:lesson.nextSequence});
  setContinued(true);setError(null);
 }
 const selectedContext=kind==="QUIZ"?snapshot:
  lesson&&course?{deliveryId:course.deliveryId,lessonId:lesson.lessonId,nextSequence:lesson.nextSequence}:null;
 const controls=<div className="space-y-4">
  {lessonsLoadError?<Alert tone="error">
   {lessonsLoadError==="SESSION_EXPIRED"?"Session expired. Please sign in again.":"Assigned courses could not be loaded."}
  </Alert>:null}
  {lessonsLoadError?<Button type="button" size="sm" variant="secondary"
   onClick={()=>router.refresh()}>Retry courses</Button>:null}
  <label className="grid gap-2 text-[13px] font-semibold text-[var(--lms-neutral-400)]">
   Course
   <Input type="search" value={courseSearch} disabled={editorBusy}
    placeholder="Search courses" onChange={event=>setCourseSearch(event.target.value)}/>
   <Select value={course?.deliveryId??""} aria-label="Select course and class"
    disabled={editorBusy} onChange={event=>chooseCourse(event.target.value)}>
    <option value="">Select course and class</option>
    {eligibleCourses.map(item=><option key={item.deliveryId} value={item.deliveryId}>{item.name}</option>)}
    {course&&!eligibleCourses.some(item=>item.deliveryId===course.deliveryId)?
     <option value={course.deliveryId}>{course.name}</option>:null}
   </Select>
  </label>
  <label className="grid gap-2 text-[13px] font-semibold text-[var(--lms-neutral-400)]">
   Lesson
   <Input type="search" value={lessonSearch} disabled={editorBusy||!course}
    placeholder="Search lessons" onChange={event=>setLessonSearch(event.target.value)}/>
   <Select value={lesson?.lessonId??""} aria-label="Select lesson"
    disabled={editorBusy||!course} onChange={event=>chooseLesson(event.target.value)}>
    <option value="">Select lesson</option>
    {eligibleLessons.map(item=><option key={item.lessonId} value={item.lessonId}>{item.lessonName}</option>)}
    {lesson&&!eligibleLessons.some(item=>item.lessonId===lesson.lessonId)?
     <option value={lesson.lessonId}>{lesson.lessonName}</option>:null}
   </Select>
  </label>
  {!courses.length&&!lessonsLoadError?<Alert tone="info">
   No assigned courses found. Assign yourself to a course before creating a {name.toLowerCase()}.
  </Alert>:null}
  {course&&!lessonChoices.length?<div className="flex flex-wrap items-center gap-2">
   <Alert tone="info">No lessons in this course yet. Create a lesson before adding a {name.toLowerCase()}.</Alert>
   <Button type="button" variant="secondary" size="sm" onClick={()=>router.refresh()}>Retry lessons</Button>
  </div>:null}
  {error?<Alert tone="error">{error}</Alert>:null}
 </div>;
 const editor=selectedContext?<div className="min-w-0"
   onInputCapture={()=>setDraftDirty(true)} onChangeCapture={()=>setDraftDirty(true)}>
   <FacultyLessonAuthoring key={selectedContext.deliveryId+":"+selectedContext.lessonId+":"+kind}
    lessonId={selectedContext.lessonId} deliveryId={selectedContext.deliveryId}
    initialMode={kind} availableModes={[kind]}
    enableAssignmentResources={kind==="ASSIGNMENT"}
    nextContentSequence={selectedContext.nextSequence}
    nextAssignmentSequence={selectedContext.nextSequence}
    nextQuizSequence={selectedContext.nextSequence}
    onBusyChange={setEditorBusy}
    onSaved={()=>{setDraftDirty(false);setContinued(false);setSnapshot(null);setOpen(false);router.refresh();}}
   />
 </div>:null;
 return <>
  <div className="flex min-w-0 flex-wrap items-center justify-end gap-3 print:hidden">
   <Button type="button" className="min-h-11 w-full sm:w-auto md:min-h-[var(--lms-control-height)]"
    onClick={()=>{setError(null);setOpen(true);}} disabled={!lessons.length&& !lessonsLoadError}>
    <span className="inline-flex items-center gap-2">
     <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 4v16M4 12h16"/>
     </svg>
     Create {name}
    </span>
   </Button>
  </div>
  {kind==="QUIZ"?<>
   <Dialog open={open&&!continued} onOpenChange={requestClose}
    title="Create Quiz" description="Select a course and lesson to create a quiz."
    className="max-w-[640px]"
    footer={<div className="flex w-full flex-wrap justify-end gap-2">
     <Button type="button" variant="secondary" onClick={()=>requestClose(false)}>Cancel</Button>
     <Button type="button" disabled={!course||!lesson||Boolean(lessonsLoadError)}
      onClick={startQuizBuilder}>Continue</Button>
    </div>}>
    {controls}
   </Dialog>
   <Dialog open={open&&continued} onOpenChange={requestClose}
    title="Quiz Builder" description="Set a future due date and add valid questions before publishing."
    className="max-w-[740px]">
    <div className="space-y-4">
     {error?<Alert tone="error">{error}</Alert>:null}
     <Button variant="secondary" type="button" disabled={editorBusy}
      onClick={()=>{setContinued(false);setSnapshot(null);}}>← Back to course and lesson</Button>
     {editor}
    </div>
   </Dialog>
  </>:<Drawer open={open} onOpenChange={requestClose}
    title="Create New Assignment"
    description="Choose your course and lesson, then prepare the assignment."
    side="right" className="md:!w-[640px]"
    footer={<div className="flex w-full flex-wrap justify-end gap-2">
     <Button variant="secondary" disabled={editorBusy} type="button" onClick={()=>requestClose(false)}>Cancel</Button>
     <Button type="button" disabled={!lesson||!course||editorBusy}
      onClick={()=>{if(!lesson||!course)setError("Select course and lesson");else setError("Complete the assignment form above and use its Create button to save.");}}>
      Create
     </Button>
    </div>}>
    <div className="space-y-4">
     {controls}
     {editor}
    </div>
   </Drawer>}
  <ConfirmDialog open={discardConfirm} onOpenChange={setDiscardConfirm}
   title={kind==="QUIZ"?"Discard this quiz draft?":"Discard this assignment draft?"}
   cancelLabel="Keep editing" confirmLabel="Discard draft" confirmVariant="danger"
   confirmDisabled={editorBusy} pending={editorBusy} onConfirm={discardDraft}/>
 </>;
}

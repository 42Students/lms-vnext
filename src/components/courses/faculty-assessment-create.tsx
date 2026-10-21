"use client";
import { Alert } from "@/components/ui/alert";
import {useMemo,useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Drawer} from "@/components/ui/drawer";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {Select} from "@/components/ui/select";
import {FacultyLessonAuthoring} from "./faculty-lesson-authoring";
import type {getFacultyAssessmentOverview} from "@/modules/courses/faculty-assessment-service";

type LessonChoice=Awaited<ReturnType<typeof getFacultyAssessmentOverview>>["lessonChoices"][number];

/** Same course → lesson entry sequence as the legacy Faculty create dialog.
 * The authoritative ownership check still runs when saving the assessment. */
export function FacultyAssessmentCreate({kind,lessons,lessonsLoadError=null}:{kind:"ASSIGNMENT"|"QUIZ";lessons:readonly LessonChoice[];lessonsLoadError?:string|null}){
 const router=useRouter();
 const [open,setOpen]=useState(false),[courseKey,setCourseKey]=useState("");
 const [lessonKey,setLessonKey]=useState(""),[continued,setContinued]=useState(false);
 const [error,setError]=useState<string|null>(null);
 const [draftDirty,setDraftDirty]=useState(false);
 const [discardConfirm,setDiscardConfirm]=useState(false);
 const name=kind==="QUIZ"?"Quiz":"Assignment";
 const courses=useMemo(()=>[...new Map(lessons.map(item=>[item.deliveryId,{
  deliveryId:item.deliveryId,name:item.courseCode+" · "+item.courseName+" · "+item.sectionName,
 }])).values()], [lessons]);
 const course=courses.find(item=>item.deliveryId===courseKey)??(courses.length===1?courses[0]:null);
 const lessonChoices=lessons.filter(item=>item.deliveryId===course?.deliveryId);
 const lesson=lessonChoices.find(item=>item.lessonId===lessonKey)??(lessonChoices.length===1?lessonChoices[0]:null);
 function selectCourse(value:string){setCourseKey(value);setLessonKey("");setContinued(false);setError(null);}
 function selectLesson(value:string){setLessonKey(value);setContinued(false);setError(null);}
 function closeDrawer(next:boolean){
   if(!next && draftDirty){setDiscardConfirm(true);return;}
   setOpen(next);
   if(!next){setContinued(false);setError(null);setDraftDirty(false);}
 }
 function discardDraft(){
   setDiscardConfirm(false);setDraftDirty(false);setOpen(false);setContinued(false);setError(null);
 }
 function start(){
  if(!course){setError("Select course");return;}
  if(!lesson){setError("Select lesson");return;}
  setContinued(true);setError(null);
 }
 return <>
  <div className="flex min-w-0 flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
   <div><h2 className="font-semibold text-[var(--lms-heading)]">Create {name}</h2>
    <p className="mt-1 text-sm text-body leading-[22px]">Quizzes and assignments are attached to lessons in your assigned courses.</p>
   </div>
   <Button className="min-h-11 w-full sm:w-auto md:min-h-[var(--lms-control-height)]" onClick={()=>setOpen(true)} disabled={!lessons.length}>Create {name}</Button>
  </div>
  {lessonsLoadError?<div className="flex flex-wrap items-center gap-2">
    <Alert tone="error">{lessonsLoadError==="SESSION_EXPIRED"?"Session expired. Please sign in again.":"Assigned courses could not be loaded"}</Alert>
    <Button type="button" size="sm" variant="secondary" onClick={()=>router.refresh()}>Retry</Button>
   </div>:!courses.length?<Alert tone="info">No assigned courses found. Assign yourself to a course before creating a {name.toLowerCase()}.</Alert>:null}
  <Drawer open={open} onOpenChange={closeDrawer}
   title={kind==="QUIZ"?"Create quiz":"Create Assignment"}
   description="Choose your assigned course and lesson before opening the assessment builder."
   footer={!continued?<Button className="min-h-11 md:min-h-[var(--lms-control-height)]" onClick={start}>Continue</Button>:undefined}>
   <div className="space-y-4">
    <label className="grid gap-2 text-[var(--lms-font-sm)] leading-4 font-semibold text-[var(--lms-neutral-400)]">Select course and class
     <Select value={course?.deliveryId??""} aria-label="Select course and class" onChange={e=>selectCourse(e.target.value)}>
      <option value="">Select course and class</option>
      {courses.map(item=><option key={item.deliveryId} value={item.deliveryId}>{item.name}</option>)}
     </Select>
    </label>
    <label className="grid gap-2 text-[var(--lms-font-sm)] leading-4 font-semibold text-[var(--lms-neutral-400)]">Select lesson
     <Select value={lesson?.lessonId??""} aria-label="Select lesson" onChange={e=>selectLesson(e.target.value)}
      disabled={!course}>
      <option value="">Select lesson</option>
      {lessonChoices.map(item=><option key={item.lessonId} value={item.lessonId}>{item.lessonName}</option>)}
     </Select>
    </label>
    {!lessonChoices.length&&course?<div className="flex flex-wrap items-center gap-2">
      <Alert tone="info">No lessons in this course yet. Create a lesson before attaching a {name.toLowerCase()} to this course.</Alert>
      <Button type="button" size="sm" variant="secondary" onClick={()=>router.refresh()}>Retry lessons</Button>
    </div>:null}
    {kind==="QUIZ"?<Alert tone="info">Set a future due date and at least one valid question before publishing. Publish now is selected by default in the builder; clear it to save a Draft.</Alert>:null}
    <div className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface-subtle p-3 text-sm">
      <strong>Quizzes are attached to lessons</strong>
      <p>This keeps faculty creation and learner attempts under the same course structure.</p>
    </div>
    {error?<Alert tone="error">{error}</Alert>:null}
    {continued&&lesson&&course?<div onInputCapture={()=>setDraftDirty(true)} onChangeCapture={()=>setDraftDirty(true)}><FacultyLessonAuthoring
      key={course.deliveryId+":"+lesson.lessonId+":"+kind}
      lessonId={lesson.lessonId} deliveryId={course.deliveryId}
      initialMode={kind} availableModes={[kind]}
      nextContentSequence={lesson.nextSequence}
      nextAssignmentSequence={lesson.nextSequence}
      nextQuizSequence={lesson.nextSequence}
      onSaved={()=>setDraftDirty(false)}
    /></div>:null}
   </div>
  </Drawer>
  <ConfirmDialog open={discardConfirm} onOpenChange={setDiscardConfirm}
    title={kind==="QUIZ"?"Discard this quiz draft?":"Discard this assignment draft?"}
    confirmLabel="Discard draft" confirmVariant="danger" onConfirm={discardDraft} />
 </>;
}

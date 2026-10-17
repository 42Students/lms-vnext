"use client";

import {useMemo,useState} from "react";
import {Button} from "@/components/ui/button";
import {Drawer} from "@/components/ui/drawer";
import {Select} from "@/components/ui/select";
import {FacultyLessonAuthoring} from "./faculty-lesson-authoring";
import type {getFacultyAssessmentOverview} from "@/modules/courses/faculty-assessment-service";

type LessonChoice=Awaited<ReturnType<typeof getFacultyAssessmentOverview>>["lessonChoices"][number];

/** Same course → lesson entry sequence as the legacy Faculty create dialog.
 * The authoritative ownership check still runs when saving the assessment. */
export function FacultyAssessmentCreate({kind,lessons}:{kind:"ASSIGNMENT"|"QUIZ";lessons:readonly LessonChoice[]}){
 const [open,setOpen]=useState(false),[courseKey,setCourseKey]=useState("");
 const [lessonKey,setLessonKey]=useState(""),[continued,setContinued]=useState(false);
 const [error,setError]=useState<string|null>(null);
 const [draftDirty,setDraftDirty]=useState(false);
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
   if(!next && draftDirty && !window.confirm(kind==="QUIZ"?"Discard this quiz draft?":"Discard this assignment draft?"))return;
   setOpen(next);
   if(!next){setContinued(false);setError(null);setDraftDirty(false);}
 }
 function start(){if(!course||!lesson){setError("Select a course and lesson first.");return;}setContinued(true);setError(null);}
 return <>
  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4">
   <div><h2 className="font-semibold text-foreground">Create {name}</h2>
    <p className="mt-1 text-sm text-body">Quizzes and assignments are attached to lessons in your assigned courses.</p>
   </div>
   <Button onClick={()=>setOpen(true)} disabled={!lessons.length}>Create {name}</Button>
  </div>
  {!courses.length?<p role="status" className="text-sm text-muted-foreground">
   No assigned courses found. Assign yourself to a course before creating a {name.toLowerCase()}.
  </p>:null}
  <Drawer open={open} onOpenChange={closeDrawer}
   title={kind==="QUIZ"?"Create quiz":"Create Assignment"}
   description="Choose your assigned course and lesson before opening the assessment builder.">
   <div className="space-y-4">
    <label className="grid gap-1 text-sm font-semibold text-body">Select course and class
     <Select value={course?.deliveryId??""} aria-label="Select course and class" onChange={e=>selectCourse(e.target.value)}>
      <option value="">Select course and class</option>
      {courses.map(item=><option key={item.deliveryId} value={item.deliveryId}>{item.name}</option>)}
     </Select>
    </label>
    <label className="grid gap-1 text-sm font-semibold text-body">Select lesson
     <Select value={lesson?.lessonId??""} aria-label="Select lesson" onChange={e=>selectLesson(e.target.value)}
      disabled={!course}>
      <option value="">Select lesson</option>
      {lessonChoices.map(item=><option key={item.lessonId} value={item.lessonId}>{item.lessonName}</option>)}
     </Select>
    </label>
    {!lessonChoices.length?<p role="status" className="text-sm text-muted-foreground">
     No lessons in this course yet. Create a lesson before attaching a {name.toLowerCase()} to this course.
    </p>:null}
    <div className="rounded-lg border border-border bg-surface-subtle p-3 text-sm">
      <strong>Quizzes are attached to lessons</strong>
      <p>This keeps faculty creation and learner attempts under the same course structure.</p>
    </div>
    {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
    {!continued?<Button onClick={start} disabled={!course||!lesson}>Continue</Button>:null}
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
 </>;
}

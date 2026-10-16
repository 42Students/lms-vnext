"use client";
import { useState } from "react";
import { FacultyLessonAuthoring } from "@/components/courses/faculty-lesson-authoring";

type Lesson={id:string;name:string;courseName:string;courseCode:string;offeringId:string;nextContentSequence:number};
type Kind="VIDEOS"|"LIVE_CLASSES"|"RESOURCES";
const modes={VIDEOS:["YOUTUBE"],LIVE_CLASSES:["LIVE_CLASS"],RESOURCES:["RESOURCE"]} as const;
export function SuperAdminContentAuthoring({kind,lessons}:{kind:Kind;lessons:Lesson[]}){
 const [lessonId,setLessonId]=useState(lessons[0]?.id??"");
 const selected=lessons.find(x=>x.id===lessonId);
 return <section aria-label="Create lesson content" className="space-y-3 rounded-xl border border-border bg-surface p-4">
  <h2 className="font-semibold">Add {kind==="VIDEOS"?"video":kind==="LIVE_CLASSES"?"live class":"resource"}</h2>
  {!lessons.length?<p className="text-sm text-muted-foreground">Create a course offering, learning path and lesson before adding content.</p>:<>
   <label className="grid gap-1 text-sm font-semibold text-body">Lesson
    <select value={lessonId} onChange={e=>setLessonId(e.target.value)}
     className="min-h-11 w-full rounded-md border border-border bg-surface px-3 text-foreground">
     {lessons.map(x=><option value={x.id} key={x.id}>{x.courseCode} · {x.courseName} · {x.name}</option>)}
    </select>
   </label>
   {selected?<FacultyLessonAuthoring key={selected.id} lessonId={selected.id}
     deliveryId={null} audience="OFFERING" nextContentSequence={selected.nextContentSequence}
     nextAssignmentSequence={0} nextQuizSequence={0} initialMode={modes[kind][0]}
     availableModes={modes[kind]}/>:null}
  </>}
 </section>;
}

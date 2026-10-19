"use client";
import { useState } from "react";
import { Select } from "@/components/ui/select";
import {resolveSuperAdminAuthoringLesson} from "@/modules/courses/super-admin-selected-lesson-model";
import { FacultyLessonAuthoring } from "@/components/courses/faculty-lesson-authoring";
import { FacultyLessonVideoManager } from "@/components/courses/faculty-lesson-video-manager";

type Lesson={id:string;name:string;courseName:string;courseCode:string;offeringId:string;nextContentSequence:number};
type Kind="VIDEOS"|"LIVE_CLASSES"|"RESOURCES";
const modes={VIDEOS:["YOUTUBE"],LIVE_CLASSES:["LIVE_CLASS"],RESOURCES:["RESOURCE"]} as const;
export function SuperAdminContentAuthoring({kind,lessons,allowVideoUpload=true}:{kind:Kind;lessons:Lesson[];allowVideoUpload?:boolean}){
 const [lessonId,setLessonId]=useState(lessons[0]?.id??"");
 // A changed acting-college scope can replace all lesson IDs without remounting this client panel.
 // Never leave a foreign/stale ID selected or silently hide the current college authoring control.
 const selected=resolveSuperAdminAuthoringLesson(lessons,lessonId);
 return <section aria-label="Create lesson content" className="space-y-3 border-b border-border pb-5">
  <h2 className="font-semibold">Add {kind==="VIDEOS"?"video":kind==="LIVE_CLASSES"?"live class":"resource"}</h2>
  {!lessons.length?<p className="text-sm text-muted-foreground">Create a course offering, learning path and lesson before adding content.</p>:<>
   <label className="grid gap-1 text-sm font-semibold text-body">Lesson
    <Select value={selected?.id??""} onChange={e=>setLessonId(e.target.value)}
     className="w-full sm:min-h-[var(--lms-control-height)]">
     {lessons.map(x=><option value={x.id} key={x.id}>{x.courseCode} · {x.courseName} · {x.name}</option>)}
    </Select>
   </label>
   {selected?<FacultyLessonAuthoring key={selected.id} lessonId={selected.id}
     deliveryId={null} audience="OFFERING" nextContentSequence={selected.nextContentSequence}
     nextAssignmentSequence={0} nextQuizSequence={0} initialMode={modes[kind][0]}
     availableModes={modes[kind]}/>:null}
   {kind==="VIDEOS"&&selected&&(allowVideoUpload?
    <FacultyLessonVideoManager key={"video:"+selected.id} lessonId={selected.id} deliveryId={null} nextContentSequence={selected.nextContentSequence}/>:
    <p className="text-sm text-muted-foreground">Binary video upload requires a real active membership in this selected college. You can still author YouTube video links. Super Admin-only user-owned uploads require a private object-storage bucket, malware scanner and the pending storage actor migration.</p>)}
  </>}
 </section>;
}

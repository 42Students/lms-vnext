"use client";
import { useState } from "react";
import { Select } from "@/components/ui/select";
import {resolveSuperAdminAuthoringLesson} from "@/modules/courses/super-admin-selected-lesson-model";
import { FacultyLessonAuthoring } from "@/components/courses/faculty-lesson-authoring";
import { FacultyLessonVideoManager } from "@/components/courses/faculty-lesson-video-manager";

type Lesson={id:string;name:string;courseName:string;courseCode:string;offeringId:string;nextContentSequence:number};
type Section={id:string;offeringId:string;courseCode:string;courseName:string;sectionName:string};
type Kind="VIDEOS"|"LIVE_CLASSES"|"RESOURCES";
const modes={VIDEOS:["YOUTUBE"],LIVE_CLASSES:["LIVE_CLASS"],RESOURCES:["RESOURCE"]} as const;

/** Keep every selector within the acting college's server-provided catalog.
 * A college switch drops stale course, lesson and Section choices rather than
 * sending the previous college's IDs to an authoring endpoint. */
export function SuperAdminContentAuthoring({kind,lessons,sections=[],allowVideoUpload=true}:{
 kind:Kind;lessons:Lesson[];sections?:Section[];allowVideoUpload?:boolean;
}){
 const [offeringId,setOfferingId]=useState(lessons[0]?.offeringId??"");
 const [lessonId,setLessonId]=useState(lessons[0]?.id??"");
 const [sectionId,setSectionId]=useState("");
 const offerings=[...new Map(lessons.map(item=>[item.offeringId,{
  id:item.offeringId,name:item.courseCode+" · "+item.courseName,
 }])).values()];
 const course=offerings.find(item=>item.id===offeringId)??offerings[0];
 const courseLessons=lessons.filter(item=>item.offeringId===course?.id);
 const selected=resolveSuperAdminAuthoringLesson(courseLessons,lessonId);
 const courseSections=sections.filter(item=>item.offeringId===course?.id);
 const selectedSection=courseSections.find(item=>item.id===sectionId);
 const deliveryId=selectedSection?.id??null;
 const contentKey=[selected?.id??"",deliveryId??"shared",kind].join(":");

 return <details aria-label="Create lesson content" className="min-w-0 border-b border-border pb-[var(--lms-space-4)]">
  <summary className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-button-primary)] bg-[var(--lms-button-primary)] px-[var(--lms-space-4)] text-sm font-[650] text-[var(--lms-on-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9 md:w-auto">Add {kind==="VIDEOS"?"video":kind==="LIVE_CLASSES"?"live class":"resource"}</summary>
  <div className="min-w-0 space-y-[var(--lms-space-3)] pt-[var(--lms-space-4)]">
   {!lessons.length?<p role="status" className="text-sm text-muted-foreground">Create a course offering, learning path and lesson before adding content.</p>:<>
    <div className="grid min-w-0 gap-3 sm:grid-cols-2">
     <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Course
      <Select value={course?.id??""} onChange={event=>{
       setOfferingId(event.target.value);setLessonId("");setSectionId("");
      }} className="min-h-11 w-full md:min-h-9">
       {offerings.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
      </Select>
     </label>
     <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Lesson
      <Select value={selected?.id??""} onChange={event=>setLessonId(event.target.value)}
       className="min-h-11 w-full md:min-h-9">
       {courseLessons.map(item=><option value={item.id} key={item.id}>{item.name}</option>)}
      </Select>
     </label>
     <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Audience
      <Select value={deliveryId??""} onChange={event=>setSectionId(event.target.value)}
       className="min-h-11 w-full md:min-h-9">
       <option value="">All sections (shared lesson content)</option>
       {courseSections.map(item=><option key={item.id} value={item.id}>{item.sectionName}</option>)}
      </Select>
     </label>
    </div>
    <p className="text-xs text-muted-foreground">Author: your authenticated account. A faculty member can be attributed only through an authorized, persisted college membership; selecting a different author does not change who performed the upload.</p>
    {selected?<FacultyLessonAuthoring key={contentKey} lessonId={selected.id}
      deliveryId={deliveryId} audience={deliveryId?"SECTION":"OFFERING"}
      nextContentSequence={selected.nextContentSequence}
      nextAssignmentSequence={0} nextQuizSequence={0} initialMode={modes[kind][0]}
      availableModes={modes[kind]}/>:null}
    {kind==="VIDEOS"&&selected&&(allowVideoUpload?
      <div className="space-y-2">
       <p className="text-xs text-muted-foreground">Upload a private video file using a signed grant, or add a YouTube link above. Uploads require an active persisted membership in the selected college. Video assets are kept separate per lesson and audience.</p>
       <FacultyLessonVideoManager key={"video:"+contentKey} lessonId={selected.id}
        deliveryId={deliveryId} nextContentSequence={selected.nextContentSequence}/>
      </div>:
      <p role="status" className="text-sm text-muted-foreground">Binary video upload is unavailable for your current college storage identity. You can still author a YouTube video link; ask a college administrator to provide an active membership before uploading private media.</p>)}
    {kind==="RESOURCES"?<p className="text-xs text-muted-foreground">Resource materials may be added to a saved resource using its secure file controls. Upload confirmation is shown only after storage verifies the file.</p>:null}
   </>}
  </div>
 </details>;
}

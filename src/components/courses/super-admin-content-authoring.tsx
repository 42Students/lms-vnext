"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
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
 const router=useRouter();
 const [resourceOpen,setResourceOpen]=useState(false);
 const [videoMode,setVideoMode]=useState<"UPLOAD"|"YOUTUBE">("UPLOAD");
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

 const isResource=kind==="RESOURCES";
 const heading=kind==="VIDEOS"?"Add a video":
  kind==="LIVE_CLASSES"?"Schedule a live class":"Add Resource";
 const author=selected&&(kind!=="VIDEOS"||videoMode==="YOUTUBE")?<FacultyLessonAuthoring key={contentKey}
   lessonId={selected.id} deliveryId={deliveryId}
   audience={deliveryId?"SECTION":"OFFERING"}
   nextContentSequence={selected.nextContentSequence}
   nextAssignmentSequence={0} nextQuizSequence={0}
   initialMode={modes[kind][0]} availableModes={modes[kind]}/>:null;
 return <section aria-label="Create lesson content" className="min-w-0 space-y-3">
  {!lessons.length?<p role="status" className="text-sm text-muted-foreground">
   Create a course offering, learning path and lesson before adding content.
  </p>:<>
   <div className="flex min-w-0 flex-wrap items-end gap-3">
    <label className="grid min-w-[160px] flex-1 gap-1 text-[13px] font-semibold text-body">Course
     <Select value={course?.id??""} onChange={event=>{
       setOfferingId(event.target.value);setLessonId("");setSectionId("");setResourceOpen(false);
      }} className="min-h-11 w-full md:min-h-9">
      {offerings.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
     </Select>
    </label>
    <label className="grid min-w-[160px] flex-1 gap-1 text-[13px] font-semibold text-body">Lesson
     <Select value={selected?.id??""} onChange={event=>{
      setLessonId(event.target.value);setSectionId("");setResourceOpen(false);
     }} className="min-h-11 w-full md:min-h-9">
      {courseLessons.map(item=><option value={item.id} key={item.id}>{item.name}</option>)}
     </Select>
    </label>
    <fieldset className="flex min-w-[220px] flex-[1.2] flex-wrap gap-2 border-0 p-0">
     <legend className="mb-1 text-[13px] font-semibold text-body">Audience</legend>
     <label className="flex min-h-9 items-center gap-1.5 text-xs text-body">
      <input type="radio" name={"content-audience-"+kind} checked={!deliveryId}
       onChange={()=>{setSectionId("");setResourceOpen(false);}}/>
      All currently eligible sections for this course
     </label>
     <label className="flex min-h-9 items-center gap-1.5 text-xs text-body">
      <input type="radio" name={"content-audience-"+kind} checked={Boolean(deliveryId)}
       disabled={!courseSections.length}
       onChange={()=>{setSectionId(courseSections[0]?.id??"");setResourceOpen(false);}}/>
      One specific section
     </label>
     {deliveryId?<Select value={deliveryId} onChange={event=>{
       setSectionId(event.target.value);setResourceOpen(false);
      }} className="min-h-11 w-full md:min-h-9" aria-label="Section">
       {courseSections.map(item=><option key={item.id} value={item.id}>{item.sectionName}</option>)}
      </Select>:null}
    </fieldset>
    {isResource?<Button type="button" disabled={!selected} onClick={()=>setResourceOpen(true)}
      className="min-h-11 gap-2 md:min-h-9">
      <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24"
       fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
       <path d="M12 5v14M5 12h14"/></svg>Add Resource
    </Button>:null}
    <Button type="button" size="sm" variant="secondary" disabled={!selected}
     className="min-h-11 md:min-h-9" onClick={()=>router.refresh()}>
     <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M3 12a9 9 0 1 0 3-6.7M3 3v6h6"/></svg>
     <span className="ml-1">Refresh</span>
    </Button>
   </div>
   <p className="text-xs text-muted-foreground">
    {deliveryId?"Only the selected section can see this content once published.":
    "This content is shared with all currently eligible sections for the selected course."}
    {" "}The authenticated author and selected college determine access; choosing a different section does not change the uploader.
   </p>
   {isResource?<Dialog open={resourceOpen} onOpenChange={setResourceOpen}
     dismissible className="max-w-[700px]"
     title="Add Resource"
     description={"Create a resource in "+(selected?.name??"the selected lesson")+
       ". Link titles and notes are supported; unverified file attachments cannot be published."}
     footer={<Button type="button" variant="secondary" onClick={()=>setResourceOpen(false)}>Cancel</Button>}>
     <div className="min-w-0 space-y-3">
      {author}
      <p className="text-xs text-muted-foreground">
       Add notes and a link title (optional) alongside an HTTPS resource URL.
       Private files require a scanned, verified upload receipt and cannot be
       attached from an untrusted local path or pasted storage URL.
      </p>
     </div>
    </Dialog>:
    <article className="min-w-0 space-y-3 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4">
     <h2 className="text-lg font-semibold text-foreground">{heading}</h2>
     {kind==="VIDEOS"?<fieldset className="flex flex-wrap gap-3" aria-label="Video type">
      <legend className="mb-2 text-[13px] font-semibold text-body">Video type</legend>
      <label className="inline-flex min-h-9 items-center gap-2 text-sm">
       <input type="radio" name="super-admin-video-kind" value="UPLOAD"
        checked={videoMode==="UPLOAD"} disabled={!allowVideoUpload}
        onChange={()=>setVideoMode("UPLOAD")}/>Video (Upload)
      </label>
      <label className="inline-flex min-h-9 items-center gap-2 text-sm">
       <input type="radio" name="super-admin-video-kind" value="YOUTUBE"
        checked={videoMode==="YOUTUBE"} onChange={()=>setVideoMode("YOUTUBE")}/>
       YouTube Video
      </label>
     </fieldset>:null}
     {author}
     {kind==="VIDEOS"&&selected&&videoMode==="UPLOAD"&&(allowVideoUpload?
      <div className="space-y-2">
       <p className="text-xs text-muted-foreground">
        Select one MP4, WebM, MOV or AVI video. The private upload uses a
        short-lived signed grant; progress and processing/scan status appear
        below. Learners cannot play videos until verification finishes.
       </p>
       <FacultyLessonVideoManager key={"video:"+contentKey}
        lessonId={selected.id} deliveryId={deliveryId}
        nextContentSequence={selected.nextContentSequence}/>
      </div>:
      <p role="status" className="text-sm text-muted-foreground">
       Private video upload is unavailable without an active college storage identity.
       You can still add a YouTube link.
      </p>)}
     {kind==="VIDEOS"?<div className="space-y-2 border-t border-border pt-3">
      <Button type="button" variant="secondary" disabled
       title="Direct third-party video imports are unavailable until server-side SSRF, type, size and malware-scan checks are deployed.">
       Import from URL
      </Button>
      <p role="status" className="text-xs text-muted-foreground">
       Direct video URL import is unavailable: only files uploaded to verified
       private storage, or YouTube links, can be saved. Remote server imports
       must pass network allowlisting, file validation and malware scanning.
      </p>
     </div>:null}
     {kind==="LIVE_CLASSES"?<p className="text-xs text-muted-foreground">
      Meetings use the selected time zone, with a 15-minute date and time step.
     </p>:null}
    </article>}
  </>}
 </section>;
}

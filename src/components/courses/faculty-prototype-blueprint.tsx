import Link from "next/link";
import {FacultyPrototypeLessonItems,type FacultyBlueprintItem} from "./faculty-prototype-lesson-items";
import {lessonContentOrderRuntimeEnabled} from "@/modules/courses/lesson-content-order-readiness";
import {normalizeAssignmentMethods} from "@/modules/courses/assignment-submission-methods";
import {orderFacultyBlueprintItems} from "@/modules/courses/faculty-blueprint-sort-model";
import {FACULTY_BLUEPRINT_ADD_KINDS,facultyBlueprintAddTarget} from "@/modules/courses/faculty-blueprint-add-target";
import type {getFacultyCourseWorkspace} from "@/modules/courses/faculty-course-service";
import type {FacultyBlueprintLessonEngagement} from "@/modules/courses/faculty-blueprint-lesson-engagement-model";

type Workspace=Awaited<ReturnType<typeof getFacultyCourseWorkspace>>;
const istDate=(date:Date)=>new Intl.DateTimeFormat("en-IN",{
 timeZone:"Asia/Kolkata",weekday:"short",day:"numeric",month:"short",
}).format(date);
const istClassTime=(date:Date)=>new Intl.DateTimeFormat("en-IN",{
 timeZone:"Asia/Kolkata",weekday:"short",day:"numeric",month:"short",
 hour:"numeric",minute:"2-digit",hour12:true,
}).format(date);

export function FacultyPrototypeBlueprint({workspace,selectedLessonId,engagement=null}:{
 workspace:Workspace;selectedLessonId:string|null;
 engagement?:readonly FacultyBlueprintLessonEngagement[]|null;
}){
 const {course,lessons}=workspace;
 const current=lessons.find(lesson=>lesson.id===selectedLessonId)??lessons[0]??null;
 const base="/teacher/courses/"+encodeURIComponent(course.deliveryId)+"/blueprint";
 const lessonUrl=(id:string,advanced=false)=>base+"?lesson="+encodeURIComponent(id)+(advanced?"&advanced=1#learning-path":"");
 const owned=(id:string|null)=>id===course.deliveryId;
 const items:FacultyBlueprintItem[]=current?orderFacultyBlueprintItems([
  ...current.contents.map(item=>({
   id:item.id,title:item.title,kind:item.contentType,status:item.status,sequence:item.sequence,
   reorderable:owned(item.deliveryId),scheduled:item.contentType==="LIVE_CLASS"&&
    Boolean(item.startsAt&&item.startsAt.getTime()>Date.now()),
   description:item.contentType==="VIDEO"?
    (item.durationSeconds?Math.max(1,Math.round(item.durationSeconds/60))+" min · ":"")+"Uploaded "+istDate(item.createdAt):
    item.contentType==="YOUTUBE"?"External YouTube video":
    item.contentType==="LIVE_CLASS"&&item.startsAt?
     istClassTime(item.startsAt)+(item.externalUrl?" · Meeting link provided":""):
    item.notes?.trim()||"Course resource",
   editor:owned(item.deliveryId)&&
    (item.contentType==="RESOURCE"||item.contentType==="VIDEO"||
     item.contentType==="YOUTUBE"||item.contentType==="LIVE_CLASS")?
    {type:"CONTENT" as const,item:{
      id:item.id,contentType:item.contentType,title:item.title,
      notes:item.notes,externalUrl:item.externalUrl,storageKey:item.storageKey,
      durationSeconds:item.durationSeconds,points:item.points,
      startsAt:item.startsAt,endsAt:item.endsAt,
    }}:null,
   href:base+"?lesson="+encodeURIComponent(current.id)+"&content="+encodeURIComponent(item.id)+
    "&advanced=1#course-item-"+encodeURIComponent(item.id),
  })),
  ...current.assignments.map(item=>({
   id:item.id,title:item.title,kind:"ASSIGNMENT",status:item.status,sequence:item.sequence,
   reorderable:false,description:item.dueAt?"Due "+istDate(item.dueAt):"No deadline",
   editor:owned(item.deliveryId)?{type:"ASSESSMENT" as const,item:{
     id:item.id,kind:"ASSIGNMENT" as const,title:item.title,
     description:item.description,dueAt:item.dueAt,
     status:item.status,updatedAt:item.updatedAt,deliveryId:item.deliveryId,
     maxPoints:item.maxPoints,allowedMethods:normalizeAssignmentMethods(item.allowedSubmissionMethods),
   }}:null,
   href:base+"?lesson="+encodeURIComponent(current.id)+"&content="+encodeURIComponent(item.id)+
    "&advanced=1#course-item-"+encodeURIComponent(item.id),
  })),
  ...current.quizzes.map(item=>({
   id:item.id,title:item.title,kind:"QUIZ",status:item.status,sequence:item.sequence,
   reorderable:false,description:(item.maxAttempts===1?"1 attempt":item.maxAttempts+" attempts")+
    (item.dueAt?" · Due "+istDate(item.dueAt):" · No deadline"),
   editor:owned(item.deliveryId)?{type:"ASSESSMENT" as const,item:{
     id:item.id,kind:"QUIZ" as const,title:item.title,
     description:item.description,dueAt:item.dueAt,
     status:item.status,updatedAt:item.updatedAt,deliveryId:item.deliveryId,
     maxAttempts:item.maxAttempts,
   }}:null,
   href:base+"?lesson="+encodeURIComponent(current.id)+"&content="+encodeURIComponent(item.id)+
    "&advanced=1#course-item-"+encodeURIComponent(item.id),
  })),
 ]):[];
 const currentLive=current?.visibleToStudents&&workspace.learningPath?.status==="PUBLISHED";
 const selectedEngagement=current?engagement?.find(row=>row.lessonId===current.id)??null:null;
 return <section className="grid min-w-0 items-start gap-[18px] lg:grid-cols-[310px_minmax(0,1fr)]"
  aria-label="Course blueprint lesson explorer">
  <aside className="min-w-0 overflow-hidden rounded-[13px] border border-[#e5ebf2]">
   <div className="flex items-center justify-between gap-2 border-b border-[#e5ebf2] px-[18px] py-4">
    <h2 className="text-xs font-bold uppercase tracking-wider text-[#60718b]">{lessons.length} lessons</h2>
    <span className="group relative">
     <button type="button" disabled title="Only the college admin can add shared syllabus lessons"
      className="faculty-proto-secondary !min-h-8 !px-3 !py-1.5 !text-xs disabled:cursor-not-allowed disabled:opacity-60">
      + Lesson
     </button>
    </span>
   </div>
   <ol className="max-h-[454px] divide-y divide-[#e5ebf2] overflow-y-auto overscroll-contain" aria-label="Course syllabus lessons">
    {lessons.map((lesson,index)=>{
     const count=lesson.contents.length+lesson.assignments.length+lesson.quizzes.length;
     const active=lesson.id===current?.id;
     const live=lesson.visibleToStudents&&workspace.learningPath?.status==="PUBLISHED";
     return <li key={lesson.id} className={active?"border-l-[3px] border-l-[#078191] bg-[#eff9fa]":"border-l-[3px] border-l-transparent"}>
      <Link href={lessonUrl(lesson.id)} aria-current={active?"page":undefined}
       className="flex min-h-[64px] items-center gap-4 px-4 py-3 no-underline hover:bg-[#f6fafb]">
       <span className="w-4 shrink-0 text-sm text-[#60718b]">{index+1}</span>
       <span className="min-w-0 flex-1"><strong className="block text-sm text-[#1d293f]">{lesson.name}</strong>
        <span className="faculty-proto-subtitle">{count===0?"Empty":count+" items"}</span></span>
       <span className={"rounded-full px-2 py-0.5 text-[11px] font-bold "+
         (count===0?"bg-[#f2f4f7] text-[#64748b]":live?"bg-green-50 text-green-700":"bg-amber-50 text-amber-800")}>
        {count===0?"Empty":live?"Live":"Draft"}</span>
      </Link>
     </li>;
    })}
   </ol>
   {!lessons.length?<p className="faculty-proto-subtitle p-5">No lessons in the current learning path. Ask your college admin to add one.</p>:null}
  </aside>
  <section className="min-w-0 overflow-hidden rounded-[13px] border border-[#e5ebf2]">
   <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e5ebf2] px-[18px] py-4">
    <div><h2 className="text-[17px] font-bold text-[#1d293f]">
     {current?"Lesson "+(lessons.findIndex(lesson=>lesson.id===current.id)+1)+": "+current.name:"No lesson selected"}
    </h2>
    <p className="faculty-proto-subtitle mt-1">{items.length} items · {currentLive?"Live":"Draft"}</p></div>
    {current?<div className="flex flex-wrap items-center gap-2">
     <button type="button" disabled title="The college admin manages the shared lesson name"
      className="faculty-proto-secondary !min-h-9 !px-3 !py-1.5 !text-xs disabled:cursor-not-allowed disabled:opacity-60">Rename</button>
     <details className="relative">
      <summary className="faculty-proto-action !min-h-9 !cursor-pointer !px-3 !py-1.5 !text-xs">+ Add content ▾</summary>
      <div className="absolute right-0 z-20 mt-2 min-w-52 overflow-hidden rounded-lg border border-[#dce5ee] bg-white py-1 shadow-lg">
       {FACULTY_BLUEPRINT_ADD_KINDS.map(label=><Link
        key={label}
        className="block px-4 py-2 text-sm text-[#243149] hover:bg-[#eff9fa] focus-visible:bg-[#eff9fa]"
        href={facultyBlueprintAddTarget(course.deliveryId,current.id,label)}>
        {label}
       </Link>)}
       <p className="border-t border-[#e5ebf2] px-4 py-2 text-xs text-[#60718b]">Uses Section-scoped video upload, content authoring or full assessment builder.</p>
      </div>
     </details>
    </div>:null}
   </div>
   {current?<FacultyPrototypeLessonItems items={items}
    lessonId={current.id} deliveryId={course.deliveryId}
    enabled={lessonContentOrderRuntimeEnabled()}/>:
    <p className="faculty-proto-subtitle p-5">Select a lesson to view the class content.</p>}
   {current?<footer className="border-t border-[#edf1f5] bg-[#fafcfd] px-[18px] py-4">
     <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#60718b]">
      How {course.sectionName} did on this lesson
     </h3>
     {selectedEngagement&&selectedEngagement.trackedItems>0?
       <p className="mt-1 text-sm text-[#243149]">
        Recorded activity: <strong>{selectedEngagement.engagedBy} of {selectedEngagement.rosterTotal}</strong> enrolled learners.
        <span className="ml-2">All {selectedEngagement.trackedItems} measurable activities completed by
         <strong> {selectedEngagement.completedBy}</strong>.</span>
        <span className="block text-xs text-[#60718b]">Time spent is not tracked. Resource and live-class completions without recorded activity are excluded.</span>
       </p>:<p className="mt-1 text-sm text-[#60718b]">
        {!currentLive?"Progress becomes available after this lesson is published.":
         engagement===null?"Lesson activity data is currently unavailable.":
         selectedEngagement?.rosterTotal===0?"No enrolled learners in this class.":
         "No measurable video or assessment activity in this lesson."}
       </p>}
       <Link className="mt-2 inline-flex font-semibold text-[#078191] hover:underline"
        href={"/teacher/courses/"+encodeURIComponent(course.deliveryId)+"/students"}>View students</Link>
    </footer>:null}
  </section>
 </section>;
}

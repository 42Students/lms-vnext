import Link from "next/link";
import type {getFacultyCourseWorkspace} from "@/modules/courses/faculty-course-service";
type Workspace=Awaited<ReturnType<typeof getFacultyCourseWorkspace>>;
export function FacultyPrototypeBlueprint({workspace,selectedLessonId}:{
 workspace:Workspace;selectedLessonId:string|null;
}){
 const {course,lessons}=workspace;
 const current=lessons.find(lesson=>lesson.id===selectedLessonId)??lessons[0]??null;
 const base="/teacher/courses/"+encodeURIComponent(course.deliveryId)+"/blueprint";
 const lessonUrl=(id:string,advanced=false)=>base+"?lesson="+encodeURIComponent(id)+(advanced?"&advanced=1#learning-path":"");
 const items=current?[
  ...current.contents.map(item=>({id:item.id,title:item.title,kind:item.contentType,status:item.status,description:item.description??null})),
  ...current.assignments.map(item=>({id:item.id,title:item.title,kind:"ASSIGNMENT",status:item.status,description:item.dueAt?"Due "+new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium"}).format(item.dueAt):null})),
  ...current.quizzes.map(item=>({id:item.id,title:item.title,kind:"QUIZ",status:item.status,description:null})),
 ]:[];
 const icon=(kind:string)=>kind==="VIDEO"?"▶":kind==="YOUTUBE"?"YT":kind==="ASSIGNMENT"?"A":kind==="QUIZ"?"Q":kind==="PDF"?"PDF":"▤";
 return <section className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.6fr)]" aria-label="Course blueprint lesson explorer">
  <aside className="min-w-0 overflow-hidden rounded-xl border border-[#e5ebf2]">
   <div className="flex items-center justify-between gap-2 border-b border-[#e5ebf2] px-5 py-4">
    <h2 className="text-xs font-bold uppercase tracking-wider text-[#60718b]">{lessons.length} lessons</h2>
    <Link href={base+"?advanced=1#learning-path"} className="faculty-proto-secondary text-sm">+ Lesson</Link>
   </div>
   <ol className="divide-y divide-[#e5ebf2]">
    {lessons.map((lesson,index)=>{
     const count=lesson.contents.length+lesson.assignments.length+lesson.quizzes.length;
     const active=lesson.id===current?.id;
     const live=lesson.visibleToStudents&&workspace.learningPath?.status==="PUBLISHED";
     return <li key={lesson.id} className={active?"border-l-4 border-l-[#078191] bg-[#eff9fa]":"border-l-4 border-l-transparent"}>
      <Link href={lessonUrl(lesson.id)} aria-current={active?"page":undefined}
       className="flex min-h-20 items-center gap-4 px-4 py-3 no-underline hover:bg-[#f6fafb]">
       <span className="text-sm text-[#60718b]">{index+1}</span>
       <span className="min-w-0 flex-1"><strong className="block text-sm text-[#1d293f]">{lesson.name}</strong>
        <span className="faculty-proto-subtitle">{count} items</span></span>
       <span className={"rounded-full px-2.5 py-1 text-xs font-bold "+(live?"bg-green-50 text-green-700":"bg-amber-50 text-amber-800")}>{live?"Live":"Draft"}</span>
      </Link>
     </li>;
    })}
   </ol>
   {!lessons.length?<p className="faculty-proto-subtitle p-5">No lessons in the current learning path.</p>:null}
  </aside>
  <section className="min-w-0 overflow-hidden rounded-xl border border-[#e5ebf2]">
   <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e5ebf2] p-5">
    <div><h2 className="text-xl font-bold text-[#1d293f]">
     {current?"Lesson "+(lessons.indexOf(current)+1)+": "+current.name:"No lesson selected"}
    </h2>
    <p className="faculty-proto-subtitle mt-1">{items.length} items · {workspace.learningPath?.status==="PUBLISHED"?"Published path":"Draft path"}</p></div>
    {current?<Link className="faculty-proto-action" href={lessonUrl(current.id,true)}>+ Lesson item</Link>:null}
   </div>
   {current?<div className="px-5 py-4">
    <p className="faculty-proto-subtitle mb-3">Content order for this class. Use the advanced editor to reorder and publish.</p>
    <ol className="divide-y divide-[#edf1f5]">{items.map(item=><li key={item.id} className="flex items-center gap-3 py-4">
     <span aria-hidden="true" className="text-[#7a8ba3]">⠿</span>
     <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#eef7f9] text-xs font-bold text-[#078191]">{icon(item.kind)}</span>
     <span className="min-w-0 flex-1">
      <Link className="block text-sm font-bold text-[#1d293f] hover:underline"
       href={base+"?lesson="+encodeURIComponent(current.id)+"&content="+encodeURIComponent(item.id)+"&advanced=1#course-item-"+encodeURIComponent(item.id)}>{item.title}</Link>
      <span className="faculty-proto-subtitle">{item.description??item.kind.replaceAll("_"," ").toLowerCase()}</span>
     </span>
     <span className={"shrink-0 rounded-full px-2 py-1 text-xs font-semibold "+(item.status==="PUBLISHED"?"bg-emerald-50 text-emerald-700":"bg-amber-50 text-amber-800")}>
      {item.status==="PUBLISHED"?"Live":item.status==="DRAFT"?"Draft":item.status}</span>
    </li>)}</ol>
    {!items.length?<p className="faculty-proto-subtitle">This lesson has no items yet.</p>:null}
   </div>:<p className="faculty-proto-subtitle p-5">Use the editor to create a lesson first.</p>}
  </section>
 </section>;
}

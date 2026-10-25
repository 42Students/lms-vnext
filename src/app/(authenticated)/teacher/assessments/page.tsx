import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {getFacultyAssessmentOverview} from "@/modules/courses/faculty-assessment-service";

type Kind="all"|"assignment"|"quiz";
export default async function FacultyAssessmentsPage({searchParams}:{
 searchParams:Promise<{kind?:string}>;
}){
 const raw=(await searchParams).kind;
 const kind:Kind=raw==="assignment"||raw==="quiz"?raw:"all";
 const context=await getCurrentRequestContext();
 const overview=await getFacultyAssessmentOverview(context);
 const assignments=overview.assignments.map(item=>({
  key:"assignment-"+item.deliveryId+"-"+item.id,id:item.id,kind:"Assignment" as const,
  courseCode:item.courseCode,sectionName:item.sectionName,title:item.title,
  dueAt:item.dueAt,status:item.status,deliveryId:item.deliveryId,
  primaryHref:"/teacher/report/assignment/"+encodeURIComponent(item.id)+
   "?deliveryId="+encodeURIComponent(item.deliveryId),
  editorHref:"/teacher/allAssignments",primaryLabel:"Grade",
 }));
 const quizzes=overview.quizzes.map(item=>({
  key:"quiz-"+item.deliveryId+"-"+item.id,id:item.id,kind:"Quiz" as const,
  courseCode:item.courseCode,sectionName:item.sectionName,title:item.title,
  dueAt:item.dueAt,status:item.status,deliveryId:item.deliveryId,
  primaryHref:"/teacher/report/quiz/"+encodeURIComponent(item.id)+
   "?deliveryId="+encodeURIComponent(item.deliveryId),
  editorHref:"/teacher/allQuizzes?content="+encodeURIComponent(item.id),
  primaryLabel:"Report",
 }));
 const rows=[...(kind==="quiz"?[]:assignments),...(kind==="assignment"?[]:quizzes)]
  .sort((a,b)=>(b.dueAt?.getTime()??0)-(a.dueAt?.getTime()??0));
 const tabs=[
  {label:"All",kind:"all" as const,count:assignments.length+quizzes.length},
  {label:"Assignments",kind:"assignment" as const,count:assignments.length},
  {label:"Quizzes",kind:"quiz" as const,count:quizzes.length},
 ];
 return <section className="space-y-5">
  <div className="flex flex-wrap items-center justify-between gap-3">
   <div><h1 className="faculty-proto-heading">Assignments & quizzes</h1>
    <p className="faculty-proto-subtitle mt-1">Assessments across your current teaching classes.</p>
   </div>
   <div className="flex flex-wrap gap-2">
    <Link href="/teacher/allAssignments" className="faculty-proto-secondary">New assignment / manage</Link>
    <Link href="/teacher/allQuizzes" className="faculty-proto-action">New quiz / manage</Link>
   </div>
  </div>
  <nav aria-label="Assessment type" className="flex flex-wrap gap-2">{tabs.map(tab=><Link
   key={tab.kind} href={tab.kind==="all"?"/teacher/assessments":"/teacher/assessments?kind="+tab.kind}
   className="faculty-proto-pill no-underline" aria-current={kind===tab.kind?"page":undefined}
   style={kind===tab.kind?{background:"#ebf8fa",borderColor:"#058b9a",color:"#007f8e"}:undefined}>
    {tab.label} {tab.count}</Link>)}</nav>
  <div className="faculty-proto-table-wrap">
   <table className="faculty-proto-table">
    <thead><tr><th>Assessment</th><th>Course / class</th><th>Due</th><th>Status</th><th>Actions</th></tr></thead>
    <tbody>{rows.map(row=><tr key={row.key}>
     <td><Link className="faculty-proto-link" href={row.editorHref}>{row.title}</Link>
      <p className="faculty-proto-subtitle">{row.kind}</p></td>
     <td>{row.courseCode} · {row.sectionName}</td>
     <td>{row.dueAt?new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeZone:"Asia/Kolkata"}).format(row.dueAt):"No deadline"}</td>
     <td><span className="rounded-full bg-[#f4f7fa] px-2 py-1 text-xs font-semibold">{row.status}</span></td>
     <td><div className="flex flex-wrap gap-3">
      <Link className="faculty-proto-link" href={row.editorHref}>Open</Link>
      <Link className="faculty-proto-link" href={row.primaryHref}>{row.primaryLabel}</Link>
     </div></td>
    </tr>)}</tbody>
   </table>
  </div>
  {rows.length===0?<p className="faculty-proto-subtitle">No assessments for this filter.</p>:null}
 </section>;
}

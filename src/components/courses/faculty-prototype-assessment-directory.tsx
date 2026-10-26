"use client";
import {useMemo,useState} from "react";
import Link from "next/link";
import {FacultyAssessmentCreate} from "./faculty-assessment-create";
import type {getFacultyAssessmentOverview} from "@/modules/courses/faculty-assessment-service";
import {facultyAssessmentSectionOptions,facultyAssessmentRowsForSection} from "@/modules/courses/faculty-assessment-section-filter-model";
export type AssessmentRow={
 key:string;kind:"Assignment"|"Quiz";deliveryId:string;title:string;courseCode:string;sectionName:string;
 dueAt:string|null;status:string;handedIn:number;eligible:number|null;toGrade:number|null;
 primaryHref:string;reportHref:string;editorHref:string;
};
const dateLabel=(value:string|null)=>value?new Intl.DateTimeFormat("en-IN",{
 timeZone:"Asia/Kolkata",weekday:"short",day:"numeric",month:"short",
}).format(new Date(value)):"Not set";
type AssessmentKindFilter="all"|"assignment"|"quiz";
export function FacultyPrototypeAssessmentDirectory({rows,lessonChoices,initialKind="all"}:{rows:readonly AssessmentRow[];
 lessonChoices:Awaited<ReturnType<typeof getFacultyAssessmentOverview>>["lessonChoices"];
 initialKind?:AssessmentKindFilter;
}){
 const [kind,setKind]=useState<AssessmentKindFilter>(initialKind);
 // The selected type is a canonical deep link: old list bookmarks may later
 // redirect here after the unified screen proves complete feature parity.
 function selectKind(next:AssessmentKindFilter){
  setKind(next);
  const url=new URL(window.location.href);
  if(next==="all")url.searchParams.delete("kind");
  else url.searchParams.set("kind",next);
  window.history.replaceState(window.history.state,"",url.pathname+url.search+url.hash);
 }
 const [course,setCourse]=useState("all");
 const courses=useMemo(()=>facultyAssessmentSectionOptions(rows),[rows]);
 const scoped=facultyAssessmentRowsForSection(rows,course);
 const visible=scoped.filter(row=>kind==="all"||
  (kind==="assignment"?row.kind==="Assignment":row.kind==="Quiz"));
 const assignmentCount=scoped.filter(row=>row.kind==="Assignment").length;
 const tabs=[
  {value:"all",label:"All",count:scoped.length},
  {value:"assignment",label:"Assignments",count:assignmentCount},
  {value:"quiz",label:"Quizzes",count:scoped.length-assignmentCount},
 ] as const;
 return <section className="space-y-5">
  <div className="flex flex-wrap items-center justify-between gap-3">
   <div><h1 className="faculty-proto-heading">Assignments &amp; quizzes</h1>
    <p className="faculty-proto-subtitle mt-1">Everything you have set, across all your courses. One list instead of two pages.</p>
   </div>
   <div className="flex flex-wrap gap-2">
    <FacultyAssessmentCreate kind="QUIZ" lessons={lessonChoices} triggerLabel="+ Quiz" triggerTone="secondary"/>
    <FacultyAssessmentCreate kind="ASSIGNMENT" lessons={lessonChoices} triggerLabel="+ Assignment"/>
   </div>
  </div>
  <div className="flex flex-wrap items-center justify-between gap-3">
   <nav aria-label="Assessment type" className="flex flex-wrap gap-2">
    {tabs.map(tab=><button key={tab.value} type="button" className="faculty-proto-pill"
     aria-pressed={kind===tab.value} onClick={()=>selectKind(tab.value)}>
     {tab.label} {tab.count}</button>)}
   </nav>
   <label className="sr-only" htmlFor="faculty-assessment-course">Filter by course</label>
   <select id="faculty-assessment-course" value={course} onChange={e=>setCourse(e.target.value)}
    className="min-h-11 min-w-48 rounded-lg border border-[#dce5ee] bg-white px-3 text-sm">
    <option value="all">All courses</option>
    {courses.map(section=><option value={section.deliveryId} key={section.deliveryId}>{section.label}</option>)}
   </select>
  </div>
  <div className="faculty-proto-table-wrap"><table className="faculty-proto-table">
   <thead><tr><th>Title</th><th>Course · Class</th><th>Due</th><th>Handed in</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
   <tbody>{visible.map(item=>{
    const draft=item.status==="DRAFT";
    const pending=item.toGrade!==null&&item.toGrade>0;
    const action=draft?"Open":pending?"Grade":item.kind==="Quiz"?"Results":item.handedIn?"Submissions":"Open";
    const primary=draft?item.editorHref:pending?item.primaryHref:
      item.kind==="Quiz"?item.reportHref:item.handedIn?item.primaryHref:item.editorHref;
    const status=draft?"Draft":pending?item.toGrade+" to grade":item.status==="PUBLISHED"?"Open":item.status;
    return <tr key={item.key}>
     <td><Link href={item.editorHref} className="font-semibold text-[#1d293f] hover:underline">
      <span className={"mr-2 rounded-full px-2 py-0.5 text-xs font-bold "+(item.kind==="Assignment"?
       "bg-cyan-50 text-[#078191]":"bg-violet-50 text-violet-700")}>{item.kind}</span>
      {item.title}</Link></td>
     <td><span className="block text-sm">{item.courseCode}</span>
      <span className="faculty-proto-subtitle">{item.sectionName}</span></td>
     <td>{dateLabel(item.dueAt)}</td>
     <td>{item.handedIn}{item.eligible===null?"":" of "+item.eligible}</td>
     <td><span className={"rounded-full px-2 py-1 text-xs font-semibold "+(draft?
      "bg-amber-50 text-amber-800":pending?"bg-red-50 text-red-700":"bg-green-50 text-green-700")}>{status}</span></td>
     <td><div className="flex justify-end gap-2">
      <Link href={primary} className="faculty-proto-action !min-h-9 !px-3 !py-1.5">{action}</Link>
      <Link href={item.reportHref} className="faculty-proto-secondary !min-h-9 !px-3 !py-1.5">Report</Link>
     </div></td>
    </tr>;
   })}</tbody>
  </table></div>
  {visible.length===0?<p className="faculty-proto-subtitle rounded-lg border border-[#e5ebf2] p-5">No assessments match these filters.</p>:null}
 </section>;
}

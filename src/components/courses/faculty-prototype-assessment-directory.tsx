"use client";
import {useMemo,useState} from "react";
import {FacultyAssessmentCreate} from "./faculty-assessment-create";
import type {getFacultyAssessmentOverview} from "@/modules/courses/faculty-assessment-service";
import {facultyAssessmentSectionOptions,facultyAssessmentRowsForSection} from "@/modules/courses/faculty-assessment-section-filter-model";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Label } from "@/components/ui/label";
import { TextLink } from "@/components/ui/text-link";
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
   <div><Heading level={1} className="faculty-proto-heading">Assignments &amp; quizzes</Heading>
    <p className="faculty-proto-subtitle mt-1">Everything you have set, across all your courses. One list instead of two pages.</p>
   </div>
   <div className="flex flex-wrap gap-2">
    <FacultyAssessmentCreate kind="QUIZ" lessons={lessonChoices} triggerLabel="+ Quiz" triggerTone="secondary"/>
    <FacultyAssessmentCreate kind="ASSIGNMENT" lessons={lessonChoices} triggerLabel="+ Assignment"/>
   </div>
  </div>
  <div className="flex flex-wrap items-center justify-between gap-3">
   <nav aria-label="Assessment type" className="flex flex-wrap gap-2">
    {tabs.map(tab=><Button variant="chip" key={tab.value} type="button"
     aria-pressed={kind===tab.value} onClick={()=>selectKind(tab.value)}>
     {tab.label} {tab.count}</Button>)}
   </nav>
   <Label className="sr-only" htmlFor="faculty-assessment-course">Filter by course</Label>
   <Select id="faculty-assessment-course" value={course} onChange={e=>setCourse(e.target.value)}
    className="min-h-11 min-w-48 rounded-lg border border-[color:var(--lms-border)] bg-surface px-3 text-sm">
    <option value="all">All courses</option>
    {courses.map(section=><option value={section.deliveryId} key={section.deliveryId}>{section.label}</option>)}
   </Select>
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
     <td><TextLink href={item.editorHref} className="text-[color:var(--lms-heading)]">
      <span className={"mr-2 rounded-full px-2 py-0.5 text-xs font-bold "+(item.kind==="Assignment"?
       "bg-[color:var(--lms-primary-subtle)] text-[color:var(--lms-button-primary)]":"bg-[color:var(--lms-purple-surface)] text-[color:var(--lms-purple)]")}>{item.kind}</span>
      {item.title}</TextLink></td>
     <td><span className="block text-sm">{item.courseCode}</span>
      <span className="faculty-proto-subtitle">{item.sectionName}</span></td>
     <td>{dateLabel(item.dueAt)}</td>
     <td>{item.handedIn}{item.eligible===null?"":" of "+item.eligible}</td>
     <td><span className={"rounded-full px-2 py-1 text-xs font-semibold "+(draft?
      "bg-[color:var(--lms-gold-subtle)] text-[color:var(--lms-warning-strong)]":pending?"bg-[color:var(--lms-error-surface)] text-[color:var(--lms-error-text)]":"bg-[color:var(--lms-success-surface)] text-[color:var(--lms-success-strong)]")}>{status}</span></td>
     <td><div className="flex justify-end gap-2">
      <TextLink variant="bare" href={primary} className="faculty-proto-action min-h-9 px-3 py-1.5">{action}</TextLink>
      <TextLink variant="bare" href={item.reportHref} className="faculty-proto-secondary min-h-9 px-3 py-1.5">Report</TextLink>
     </div></td>
    </tr>;
   })}</tbody>
  </table></div>
  {visible.length===0?<p className="faculty-proto-subtitle rounded-lg border border-[color:var(--lms-border)] p-5">No assessments match these filters.</p>:null}
 </section>;
}

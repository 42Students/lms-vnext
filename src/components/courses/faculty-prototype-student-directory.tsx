"use client";
import {useMemo,useState} from "react";
import Link from "next/link";
import type {FacultyCourseRosterLearner} from "@/components/courses/faculty-course-roster";
import {facultyRosterCsv,facultyRosterFileName} from "@/modules/courses/faculty-roster-export";
import type {getFacultyCourseHomeSignals} from "@/modules/courses/faculty-course-home-service";
function maskPhone(value:string){const digits=value.replace(/\D/g,"");return digits.length<6?"Call student":digits.slice(0,2)+"x".repeat(digits.length-4)+digits.slice(-2);}


type Signals=Awaited<ReturnType<typeof getFacultyCourseHomeSignals>>|null;
function percent(value:number|null,mode:"progress"|"attendance"){
 const tone=value===null?"bg-[#f1f4f7] text-[#60718b]":
  value<(mode==="progress"?50:70)?"bg-red-50 text-red-700":
  value<80?"bg-amber-50 text-amber-800":"bg-emerald-50 text-emerald-700";
 return <span className={"rounded-full px-2.5 py-1 text-xs font-bold "+tone}>
  {value===null?"—":value+"%"}</span>;
}

/** Screenshot #06: exact attendance for every learner, real submission
 * progress and completed/assigned counts; never display grades as progress. */
export function FacultyPrototypeStudentDirectory({learners,signals,deliveryId}:{
 learners:readonly FacultyCourseRosterLearner[];signals:Signals;deliveryId:string;
}){
 const [query,setQuery]=useState("");
 const [view,setView]=useState<"ALL"|"BEHIND">("ALL");
 const metrics=signals?.studentRosterMetrics??null;
 const completion=signals?.courseCompletion??null;
 const progressById=new Map(completion?.byLearner.map(item=>[item.membershipId,item.progressPercent] as const)??[]);
 const recordById=new Map(metrics?.byLearner.map(item=>[item.membershipId,item] as const)??[]);
 const assignmentComplete=Boolean(signals?.completeness.assignments);
 const attendanceComplete=Boolean(signals?.completeness.attendance);
 const students=useMemo(()=>learners.filter(student=>
  (view==="ALL"||(completion?.byLearner.find(row=>row.membershipId===student.membershipId)?.progressPercent??100)<30)&&
  [student.displayName,student.rollNumber,student.phoneE164,student.email]
   .some(value=>value?.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
 ),[learners,query,view,completion]);
 function exportCsv(){
  const csv=facultyRosterCsv(students);
  const url=URL.createObjectURL(new Blob(["\uFEFF",csv],{type:"text/csv;charset=utf-8"}));
  const anchor=document.createElement("a");
  anchor.href=url;anchor.download=facultyRosterFileName("assigned-class");
  document.body.appendChild(anchor);anchor.click();anchor.remove();
  window.setTimeout(()=>URL.revokeObjectURL(url),30_000);
 }
 const cards=[
  {label:"Students",value:learners.length,tone:"text-[#1d293f]"},
  {label:"Behind on the course",value:completion?.behindTotal??"—",
   tone:"text-red-700"},
  {label:"Attendance under 75%",value:attendanceComplete&&metrics?metrics.lowAttendanceTotal:"—",
   tone:"text-orange-700"},
  {label:signals?.latestAssignmentMissing?"Not submitted "+signals.latestAssignmentMissing.title:"Not submitted latest assignment",
   value:signals?.latestAssignmentMissing?.missing??"—",tone:"text-[#1d293f]"},
 ];
 return <section aria-label="Faculty prototype students" className="space-y-5">
  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map(card=>
   <div key={card.label} className="rounded-xl border border-[#e5ebf2] p-5">
    <p className="faculty-proto-subtitle">{card.label}</p>
    <p className={"mt-1 text-3xl font-extrabold tabular-nums "+card.tone}>{card.value}</p>
   </div>)}</div>
  <div className="flex min-w-0 flex-wrap items-center gap-2">
   <label htmlFor="faculty-student-directory-search" className="sr-only">Search students</label>
   <input id="faculty-student-directory-search" value={query} type="search"
    onChange={event=>setQuery(event.target.value)}
    className="h-11 min-w-0 flex-[1_1_220px] rounded-lg border border-[#dce5ee] px-4 text-sm"
    placeholder="Search by name, roll no, phone or email"/>
   <div className="flex shrink-0 flex-wrap gap-2" role="group" aria-label="Roster filter">
    <button type="button" aria-pressed={view==="ALL"} onClick={()=>setView("ALL")}
     className={"faculty-proto-pill"+(view==="ALL"?" !border-[#078191] !text-[#078191]":"")}>All {learners.length}</button>
    <button type="button" aria-pressed={view==="BEHIND"} disabled={!completion}
     onClick={()=>setView("BEHIND")}
     className={"faculty-proto-pill"+(view==="BEHIND"?" !border-[#078191] !text-[#078191]":"")}>
      Behind {completion?.behindTotal??"—"}</button>
   </div>
   <button className="faculty-proto-secondary shrink-0" aria-label="Download roster CSV"
    type="button" onClick={exportCsv} disabled={!students.length}>Download list</button>
  </div>
  <div className="faculty-proto-table-wrap"><table className="faculty-proto-table">
   <thead><tr><th>Student</th><th>Roll no</th>
    <th title="Published course content completion">Progress</th><th>Attendance</th><th>Assignments</th><th>Contact</th></tr></thead>
   <tbody>{students.map(student=>{
    const name=student.displayName?.trim()||student.email||"Student";
    const parts=name.split(/\s+/).filter(Boolean);
    const initials=((parts[0]?.[0]??"")+(parts.at(-1)?.[0]??"")).toUpperCase();
    const detail="/teacher/courses/"+encodeURIComponent(deliveryId)+
     "/students/"+encodeURIComponent(student.membershipId);
    const row=recordById.get(student.membershipId);
    const progress=completion?progressById.get(student.membershipId)??null:null;
    const attendance=attendanceComplete?row?.attendancePercent??null:null;
    return <tr key={student.membershipId}>
     <td><div className="flex items-center gap-3">
      <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e0f1f4] text-xs font-bold text-[#007f8e]">{initials||"ST"}</span>
      <Link className="font-semibold text-[#1d293f] hover:text-[#007f8e] hover:underline" href={detail}>{name}</Link>
     </div></td>
     <td>{student.rollNumber??"—"}</td>
     <td>{percent(progress,"progress")}</td>
     <td>{percent(attendance,"attendance")}</td>
     <td>{assignmentComplete&&row?row.submittedAssignments+" of "+row.totalAssignments:"—"}</td>
     <td><div className="flex min-w-0 flex-col text-xs leading-5">
      {student.phoneE164?<a className="text-[#60718b] hover:text-[#078191] hover:underline"
       href={"tel:"+student.phoneE164.replace(/[^+\d]/g,"")} title={"Call "+name}>
       {maskPhone(student.phoneE164)}</a>:null}
      {student.email?<a className="break-all text-[#60718b] hover:text-[#078191] hover:underline"
       href={"mailto:"+student.email} title={"Email "+name}>{student.email}</a>:null}
      {!student.phoneE164&&!student.email?<span>—</span>:null}
     </div></td>
    </tr>;
   })}</tbody>
  </table></div>
  {!students.length?<p className="faculty-proto-subtitle">No students match your search.</p>:null}
  <p className="faculty-proto-subtitle">Phone and email are visible only for students in your authorized class.
   Selecting a phone number or email opens your call or mail app. The roster CSV intentionally omits private contacts.
   Progress includes completed published videos, assignments, and quizzes. Behind means under 30% completion.
   Attendance uses marked sessions; a dash means the data is unavailable.</p>
 </section>;
}

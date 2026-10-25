"use client";
import {useMemo,useState} from "react";
import Link from "next/link";
import type {FacultyCourseRosterLearner} from "@/components/courses/faculty-course-roster";
import {facultyRosterCsv,facultyRosterFileName} from "@/modules/courses/faculty-roster-export";
import type {getFacultyCourseHomeSignals} from "@/modules/courses/faculty-course-home-service";

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
 const students=useMemo(()=>learners.filter(student=>
  [student.displayName,student.rollNumber,student.phoneE164,student.email]
   .some(value=>value?.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
 ),[learners,query]);
 const metrics=signals?.studentRosterMetrics??null;
 const recordById=new Map(metrics?.byLearner.map(item=>[item.membershipId,item] as const)??[]);
 const assignmentComplete=Boolean(signals?.completeness.assignments);
 const attendanceComplete=Boolean(signals?.completeness.attendance);
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
  {label:"Behind on the course",value:assignmentComplete&&metrics?metrics.behindTotal:"—",
   tone:"text-red-700"},
  {label:"Attendance under 75%",value:attendanceComplete&&metrics?metrics.lowAttendanceTotal:"—",
   tone:"text-orange-700"},
 ];
 return <section aria-label="Faculty prototype students" className="space-y-5">
  <div className="grid gap-3 md:grid-cols-3">{cards.map(card=>
   <div key={card.label} className="rounded-xl border border-[#e5ebf2] p-5">
    <p className="faculty-proto-subtitle">{card.label}</p>
    <p className={"mt-1 text-3xl font-extrabold tabular-nums "+card.tone}>{card.value}</p>
   </div>)}</div>
  <div className="flex items-center gap-3">
   <label htmlFor="faculty-student-directory-search" className="sr-only">Search students</label>
   <input id="faculty-student-directory-search" value={query} type="search"
    onChange={event=>setQuery(event.target.value)}
    className="h-11 w-full rounded-lg border border-[#dce5ee] px-4 text-sm"
    placeholder="Search by name, roll no, phone or email"/>
  </div>
  <div className="faculty-proto-table-wrap"><table className="faculty-proto-table">
   <thead><tr><th>Student</th><th>Roll no</th>
    <th title="Published assignment submission progress">Progress</th><th>Attendance</th><th>Assignments</th></tr></thead>
   <tbody>{students.map(student=>{
    const name=student.displayName?.trim()||student.email||"Student";
    const parts=name.split(/\s+/).filter(Boolean);
    const initials=((parts[0]?.[0]??"")+(parts.at(-1)?.[0]??"")).toUpperCase();
    const detail="/teacher/courses/"+encodeURIComponent(deliveryId)+
     "/students/"+encodeURIComponent(student.membershipId);
    const row=recordById.get(student.membershipId);
    const progress=assignmentComplete?row?.assignmentProgressPercent??null:null;
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
    </tr>;
   })}</tbody>
  </table></div>
  {!students.length?<p className="faculty-proto-subtitle">No students match your search.</p>:null}
  <div className="flex flex-wrap items-center justify-between gap-3">
   <p className="faculty-proto-subtitle">Progress is based on submitted published assignments, not lesson-view history or grades.
    Attendance uses marked class sessions only. A dash means reliable data is not available.</p>
   <button className="faculty-proto-secondary shrink-0" aria-label="Download roster CSV"
    type="button" onClick={exportCsv} disabled={!students.length}>Download roster CSV</button>
  </div>
 </section>;
}

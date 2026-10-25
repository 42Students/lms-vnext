"use client";
import {useMemo,useState} from "react";
import Link from "next/link";
import type {FacultyCourseRosterLearner} from "@/components/courses/faculty-course-roster";
import {facultyRosterCsv,facultyRosterFileName} from "@/modules/courses/faculty-roster-export";
import type {getFacultyCourseHomeSignals} from "@/modules/courses/faculty-course-home-service";
type Signals=Awaited<ReturnType<typeof getFacultyCourseHomeSignals>>|null;
function tag(value:number|null,label:string){
 return <span className={"rounded-full px-2.5 py-1 text-xs font-bold "+
  (value===null?"bg-[#f1f4f7] text-[#718097]":value<75?"bg-red-50 text-red-700":"bg-emerald-50 text-emerald-700")}>
  {value===null?"—":value+"%"}<span className="sr-only"> {label}</span>
 </span>;
}
export function FacultyPrototypeStudentDirectory({learners,signals,deliveryId}:{
 learners:readonly FacultyCourseRosterLearner[];signals:Signals;deliveryId:string;
}){
 const [query,setQuery]=useState("");
 const students=useMemo(()=>learners.filter(student=>
  [student.displayName,student.rollNumber,student.phoneE164,student.email]
   .some(value=>value?.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
 ),[learners,query]);
 const low=new Map(signals?.attendance.lowAttendance.map(s=>[s.membershipId,s.attendancePercent])??[]);
 const graded=new Map(signals?.performance.studentAverages.map(s=>[s.membershipId,s.averagePercent])??[]);
 const inReview=new Map<string,number>();
 for(const submission of signals?.pendingSubmissions??[]){
  inReview.set(submission.membershipId,(inReview.get(submission.membershipId)??0)+1);
 }
 function exportCsv(){
  const csv=facultyRosterCsv(students);
  const url=URL.createObjectURL(new Blob(["\uFEFF",csv],{type:"text/csv;charset=utf-8"}));
  const anchor=document.createElement("a");
  anchor.href=url;anchor.download=facultyRosterFileName("assigned-class");
  document.body.appendChild(anchor);
  anchor.click();anchor.remove();
  window.setTimeout(()=>URL.revokeObjectURL(url),30_000);
 }
 const available=Boolean(signals?.completeness.attendance&&signals?.completeness.assignments);
 const metrics=[
  {label:"Students",value:learners.length},
  {label:"Need attention",value:available?signals!.atRiskTotal:"—"},
  {label:"Attendance under 75%",value:signals?.completeness.attendance?low.size:"—"},
  {label:"With graded work",value:signals?.completeness.assignments?graded.size:"—"},
 ];
 return <section aria-label="Faculty prototype students" className="space-y-5">
  <div className="grid gap-3 md:grid-cols-4">{metrics.map(metric=>
   <div key={metric.label} className="rounded-xl border border-[#e5ebf2] p-5">
    <p className="faculty-proto-subtitle">{metric.label}</p>
    <p className="mt-2 text-3xl font-extrabold text-[#1d293f] tabular-nums">{metric.value}</p>
   </div>)}</div>
  <div className="flex flex-wrap items-center justify-between gap-3">
   <h2 className="text-base font-bold text-[#1d293f]">Class list</h2>
   <button className="faculty-proto-secondary" aria-label="Download roster CSV"
    type="button" onClick={exportCsv} disabled={students.length===0}>Download roster CSV</button>
  </div>
  <label htmlFor="faculty-student-directory-search" className="sr-only">Search students</label>
  <input id="faculty-student-directory-search" value={query} type="search"
   onChange={event=>setQuery(event.target.value)}
   className="h-11 w-full rounded-lg border border-[#dce5ee] px-4 text-sm"
   placeholder="Search by name, roll no, phone or email"/>
  <div className="faculty-proto-table-wrap"><table className="faculty-proto-table">
   <thead><tr><th>Student</th><th>Roll no</th><th>Grade avg</th><th>Attendance</th><th>Work to grade</th></tr></thead>
   <tbody>{students.map(student=>{
    const name=student.displayName?.trim()||student.email||"Student";
    const parts=name.split(/\s+/).filter(Boolean);
    const initials=((parts[0]?.[0]??"")+(parts.at(-1)?.[0]??"")).toUpperCase();
    const score=graded.get(student.membershipId)??null;
    const attendance=signals?.completeness.attendance?
     (signals.attendance.markedSessions>0?low.get(student.membershipId)??75:null):null;
    return <tr key={student.membershipId}>
     <td><div className="flex items-center gap-3">
      <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e0f1f4] text-xs font-bold text-[#007f8e]">{initials||"ST"}</span>
      <span className="min-w-0">
       <Link className="faculty-proto-link" href={"/teacher/courses/"+encodeURIComponent(deliveryId)+"/students/"+encodeURIComponent(student.membershipId)}>{name}</Link>
       <Link className="block text-xs text-[#078191] hover:underline"
        aria-label={"View student details for "+name}
        href={"/teacher/courses/"+encodeURIComponent(deliveryId)+"/students/"+encodeURIComponent(student.membershipId)}>View student details</Link>
      </span>
     </div></td>
     <td>{student.rollNumber??"—"}</td><td>{tag(score,"average graded score")}</td>
     <td>{attendance===75&&!low.has(student.membershipId)?
      <span className="text-xs text-[#60718b]">≥75%</span>:tag(attendance,"attendance")}</td>
     <td>{signals?.completeness.assignments?(inReview.get(student.membershipId)??0):"—"}</td>
    </tr>;
   })}</tbody>
  </table></div>
  {students.length===0?<p className="faculty-proto-subtitle">No matching students</p>:null}
  <p className="faculty-proto-subtitle">Grade averages use available graded assignments, not course-completion progress. Attendance is shown exactly only for flagged low-attendance students; other recorded attendance is shown as at least 75%. Detailed learner and roster records remain available below.</p>
 </section>;
}

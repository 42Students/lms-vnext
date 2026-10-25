"use client";

import {useState} from "react";
import Link from "next/link";
import type {FacultyCourseListRow} from "./faculty-course-list";

type CourseRow = {
 id:string;
 name:string;
 code:string;
 kind:"Regular"|"Elective";
 credits:number|null;
 classes:string[];
 deliveries:string[];
 classLinks:{name:string;deliveryId:string}[];
 drafts:number;
};

export function FacultyPrototypeCourseDirectory({rows,totalAssignments}:{
 rows:readonly FacultyCourseListRow[];
 totalAssignments:number;
}){
 const [q,setQ]=useState("");
 const [kind,setKind]=useState<"All"|"Regular"|"Elective">("All");
 const grouped=new Map<string,CourseRow>();
 for(const {course,workspace} of rows){
  const current=grouped.get(course.courseId);
  const offeringKind=course.offeringType==="ELECTIVE"?"Elective" as const:"Regular" as const;
  if(current){
   if(!current.classes.includes(course.sectionName))current.classes.push(course.sectionName);
   current.deliveries.push(course.deliveryId);
   if(!current.classLinks.some(x=>x.deliveryId===course.deliveryId))current.classLinks.push({name:course.sectionName,deliveryId:course.deliveryId});
   current.drafts+=workspace.summary.draftItems;
  }else grouped.set(course.courseId,{
   id:course.courseId,name:course.courseName,code:course.courseCode,
   kind:offeringKind,credits:course.credits,
   classes:[course.sectionName],deliveries:[course.deliveryId],
   classLinks:[{name:course.sectionName,deliveryId:course.deliveryId}],
   drafts:workspace.summary.draftItems,
  });
 }
 const courses=[...grouped.values()];
 const counts={
  All:courses.length,Regular:courses.filter(c=>c.kind==="Regular").length,
  Elective:courses.filter(c=>c.kind==="Elective").length,
 };
 const visible=courses.filter(c=>(kind==="All"||c.kind===kind)&&
  [c.name,c.code,...c.classes].some(value=>value.toLocaleLowerCase().includes(q.toLocaleLowerCase())));
 return <section aria-label="Courses in the new Faculty prototype" className="space-y-5">
  <div className="flex flex-wrap items-center justify-between gap-4">
   <div className="min-w-0">
    <h1 className="faculty-proto-heading">Courses</h1>
    <p className="faculty-proto-subtitle mt-1">{counts.All} {counts.All===1?"course":"courses"} on this page, {totalAssignments} active teaching {totalAssignments===1?"assignment":"assignments"}.</p>
   </div>
   <label className="sr-only" htmlFor="faculty-course-search">Search courses</label>
   <input id="faculty-course-search" type="search" value={q}
    onChange={event=>setQ(event.target.value)} placeholder="Search courses"
    className="h-11 w-full rounded-lg border border-[#dce5ee] bg-white px-4 text-sm sm:w-64"
   />
  </div>
  <div className="flex flex-wrap gap-2" role="group" aria-label="Course type">
   {(["All","Regular","Elective"] as const).map(option=>
    <button key={option} type="button" onClick={()=>setKind(option)} aria-pressed={kind===option}
     className="faculty-proto-pill">{option} {counts[option]}</button>)}
  </div>
  <div className="faculty-proto-table-wrap">
   <table className="faculty-proto-table">
    <thead><tr><th>Course</th><th>Classes</th><th>To do</th><th>Attendance</th><th><span className="sr-only">Open</span></th></tr></thead>
    <tbody>{visible.map(course=><tr key={course.id}>
     <td><Link className="faculty-proto-link" href={"/teacher/courses/"+encodeURIComponent(course.deliveries[0]!)}>
      {course.name}</Link>
      <p className="faculty-proto-subtitle">{course.code} · {course.kind}{course.credits!==null?" · "+course.credits+" credits":""}</p>
     </td>
     <td><div className="flex flex-wrap gap-x-3 gap-y-2">
      {course.classLinks.map(link=><Link key={link.deliveryId}
       className="faculty-proto-link" href={"/teacher/courses/"+encodeURIComponent(link.deliveryId)+"/home"}>{link.name}</Link>)}
     </div></td>
     <td><span className={"rounded-full px-2.5 py-1 text-xs font-semibold "+(course.drafts>0?"bg-amber-50 text-amber-800":"bg-emerald-50 text-emerald-800")}>
       {course.drafts>0?course.drafts+" to publish":"No drafts"}
     </span></td>
     <td><Link className="faculty-proto-link text-sm" href={"/teacher/courses/"+encodeURIComponent(course.deliveries[0]!)+"/attendanceDetail"}>View</Link></td>
     <td><Link className="faculty-proto-link text-sm" href={"/teacher/courses/"+encodeURIComponent(course.deliveries[0]!)}>Open</Link></td>
    </tr>)}</tbody>
   </table>
  </div>
  {visible.length===0?<p className="faculty-proto-subtitle rounded-lg border border-[#dce5ee] p-5">
   No assigned courses match this search and type.</p>:null}
  {courses.length>0?<p className="faculty-proto-subtitle">Select any assigned class above to open its exact teaching workspace.</p>:null}
 </section>;
}

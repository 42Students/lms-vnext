"use client";

import {useState} from "react";
import type {FacultyCourseListRow} from "./faculty-course-list";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Label } from "@/components/ui/label";
import { TextLink } from "@/components/ui/text-link";
import { Table } from "@/components/ui/table";

type CourseRow = {
 id:string;
 name:string;
 code:string;
 kind:"Regular"|"Elective";
 credits:number|null;
 academicPeriodId:string;
 academicPeriodName:string;
 classes:string[];
 deliveries:string[];
 classLinks:{name:string;deliveryId:string}[];
 drafts:number;
 toGrade:number;
 attendancePresent:number;
 attendancePossible:number;
};

export function FacultyPrototypeCourseDirectory({rows,totalAssignments,pendingByDelivery,attendanceByDelivery}:{
 rows:readonly FacultyCourseListRow[];
 totalAssignments:number;
 pendingByDelivery:Record<string,number>;
 attendanceByDelivery:Record<string,{present:number;possible:number}|null>;
}){
 const [q,setQ]=useState("");
 const [kind,setKind]=useState<"All"|"Regular"|"Elective">("All");
 // The list itself is authorized. Never silently hide other assigned terms
 // on initial load: the Faculty must choose a term explicitly.
 const [period,setPeriod]=useState("all");
 const grouped=new Map<string,CourseRow>();
 for(const {course,workspace} of rows){
  const key=course.courseId+":"+course.academicPeriodId;
  const current=grouped.get(key);
  const offeringKind=course.offeringType==="ELECTIVE"?"Elective" as const:"Regular" as const;
  const attendance=attendanceByDelivery[course.deliveryId];
  if(current){
   if(!current.classes.includes(course.sectionName))current.classes.push(course.sectionName);
   current.deliveries.push(course.deliveryId);
   if(!current.classLinks.some(x=>x.deliveryId===course.deliveryId))current.classLinks.push({name:course.sectionName,deliveryId:course.deliveryId});
   current.drafts+=workspace.summary.draftItems;
   current.toGrade+=(pendingByDelivery[course.deliveryId]??0);
   current.attendancePresent+=attendance?.present??0;
   current.attendancePossible+=attendance?.possible??0;
  }else grouped.set(key,{
   id:key,name:course.courseName,code:course.courseCode,
   kind:offeringKind,credits:course.credits,
   academicPeriodId:course.academicPeriodId,academicPeriodName:course.academicPeriodName,
   classes:[course.sectionName],deliveries:[course.deliveryId],
   classLinks:[{name:course.sectionName,deliveryId:course.deliveryId}],
   drafts:workspace.summary.draftItems,
   toGrade:pendingByDelivery[course.deliveryId]??0,
   attendancePresent:attendance?.present??0,
   attendancePossible:attendance?.possible??0,
  });
 }
 const courses=[...grouped.values()];
 const periods=[...new Map(courses.map(c=>[c.academicPeriodId,c.academicPeriodName] as const)).entries()];
 const scope=courses.filter(c=>period==="all"||c.academicPeriodId===period);
 const counts={
  All:scope.length,Regular:scope.filter(c=>c.kind==="Regular").length,
  Elective:scope.filter(c=>c.kind==="Elective").length,
 };
 const visible=scope.filter(c=>(kind==="All"||c.kind===kind)&&
  [c.name,c.code,...c.classes].some(value=>value.toLocaleLowerCase().includes(q.toLocaleLowerCase())));
 return <section aria-label="Courses in the new Faculty prototype" className="space-y-5">
  <div className="flex flex-wrap items-center justify-between gap-4">
   <div className="min-w-0">
    <Heading level={1} className="faculty-proto-heading">Courses</Heading>
    <p className="faculty-proto-subtitle mt-1">{counts.All} {counts.All===1?"course":"courses"} you teach {period==="all"?"across periods":"this semester"}, {new Set(scope.flatMap(c=>c.deliveries)).size} classes. <span className="sr-only">{totalAssignments} teaching assignment records.</span></p>
   </div>
   <div className="flex min-w-0 flex-wrap gap-2">
   <Label className="sr-only" htmlFor="faculty-course-search">Search courses</Label>
   <Input id="faculty-course-search" type="search" value={q}
    onChange={event=>setQ(event.target.value)} placeholder="Search courses"
    className="h-11 w-full rounded-lg border border-[color:var(--lms-border)] bg-surface px-4 text-sm sm:w-56"
   />
   <Label className="sr-only" htmlFor="faculty-course-period">Academic period</Label>
   <Select id="faculty-course-period" value={period}
    className="min-h-11 min-w-48 rounded-lg border border-[color:var(--lms-border)] bg-surface px-3 text-sm"
    onChange={event=>{setPeriod(event.target.value);setKind("All");}}>
    <option value="all">All academic periods</option>
    {periods.map(([id,name])=><option key={id} value={id}>{name}</option>)}
   </Select>
   </div>
  </div>
  <div className="flex flex-wrap gap-2" role="group" aria-label="Course type">
   {(["All","Regular","Elective"] as const).map(option=>
    <Button variant="chip" key={option} type="button" onClick={()=>setKind(option)} aria-pressed={kind===option}>{option==="Elective"?"Electives":option} {counts[option]}</Button>)}
  </div>
  <Table>
    <thead><tr><th>Course</th><th>Classes</th><th>To do</th><th>Attendance</th><th><span className="sr-only">Open</span></th></tr></thead>
    <tbody>{visible.map(course=><tr key={course.id}>
     <td>{course.classLinks.length===1?<TextLink variant="bare" className="faculty-proto-link" href={"/teacher/courses/"+encodeURIComponent(course.deliveries[0]!)+"/home"}>
      {course.name}</TextLink>:<strong className="text-[color:var(--lms-button-primary)]">{course.name}</strong>}
      <p className="faculty-proto-subtitle">{course.code} · {course.kind}{course.credits!==null?" · "+course.credits+" credits":""}</p>
     </td>
     <td><div className="flex flex-wrap gap-x-1 gap-y-2">
      {course.classLinks.map((link,index)=><span key={link.deliveryId}><TextLink
       className="text-[color:var(--lms-heading)]" href={"/teacher/courses/"+encodeURIComponent(link.deliveryId)+"/home"}>{link.name}</TextLink>{index<course.classLinks.length-1?",":""}</span>)}
     </div></td>
     <td><span className={"rounded-full px-3 py-1 text-xs font-semibold "+(course.toGrade>0?"bg-[color:var(--lms-error-surface)] text-[color:var(--lms-error-text)]":course.drafts>0?"bg-[color:var(--lms-gold-subtle)] text-[color:var(--lms-warning-strong)]":"bg-[color:var(--lms-success-surface)] text-[color:var(--lms-success)]")}>
       {course.toGrade>0?course.toGrade+" to grade":course.drafts>0?course.drafts+" to publish":"Nothing waiting"}
     </span></td>
     <td>{course.classLinks.length===1?<TextLink className="text-sm text-[color:var(--lms-heading)]" href={"/teacher/courses/"+encodeURIComponent(course.deliveries[0]!)+"/attendanceDetail"}>{course.attendancePossible>0?Math.round(course.attendancePresent*100/course.attendancePossible)+"% this month":"Not recorded"}</TextLink>
      :<span className="text-sm text-body">{course.classLinks.length} classes · Select a class to view attendance</span>}</td>
     <td>{course.classLinks.length===1?<TextLink variant="bare" className="faculty-proto-secondary min-h-9 px-3 py-1.5 text-xs" href={"/teacher/courses/"+encodeURIComponent(course.deliveries[0]!)+"/home"}>Open</TextLink>
      :<span className="text-sm font-semibold text-[color:var(--lms-button-primary)]">Choose class</span>}</td>
    </tr>)}</tbody>
   </Table>
  {visible.length===0?<div role="status" className="faculty-proto-subtitle rounded-lg border border-[color:var(--lms-border)] p-5">
   {courses.length===0?<p>No teaching assignments found. Please contact your administrator.</p>:
    <p>{q.trim()?"No courses match your search":"No assigned courses match this course type."}</p>}
   {courses.length===0?<p>Your teaching courses will appear after an administrator assigns you a class.</p>:null}
  </div>:null}
  {courses.length>0?<p className="faculty-proto-subtitle">Each class name opens that exact authorized teaching Section. For courses taught across classes, choose the class explicitly; the detailed teaching filters remain available below.</p>:null}
 </section>;
}

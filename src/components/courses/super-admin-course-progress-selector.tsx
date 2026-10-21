"use client";
import {useState} from "react";
import {Select} from "@/components/ui/select";

type Option={code:string;name:string};
/** A class change clears course selection before another report is requested. */
export function SuperAdminCourseProgressSelector({courses,cohorts,selectedCourse,selectedCohort}:{
 courses:readonly Option[];cohorts:readonly Option[];
 selectedCourse?:string;selectedCohort?:string;
}){
 const [cohort,setCohort]=useState(selectedCohort??"");
 const [course,setCourse]=useState(selectedCourse??"");
 const css="min-h-11 w-full md:min-h-9";
 return <>
  <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
   Choose class
   <Select name="cohortCode" value={cohort} className={css}
    onChange={event=>{setCohort(event.target.value);setCourse("");}}>
    <option value="">Select class (batch)</option>
    {cohorts.map(item=><option value={item.code} key={item.code}>{item.name} ({item.code})</option>)}
   </Select>
  </label>
  <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
   Choose course
   <Select name="courseCode" value={course} className={css}
    disabled={!cohort} onChange={event=>setCourse(event.target.value)}>
    <option value="">Select a course</option>
    {courses.map(item=><option value={item.code} key={item.code}>{item.name} ({item.code})</option>)}
   </Select>
  </label>
 </>;
}

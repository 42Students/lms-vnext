"use client";

import Link from "next/link";
import {useState} from "react";
import type {getCollegeLearnerProgressReport} from "@/modules/courses/college-learner-progress-service";

type Result=Awaited<ReturnType<typeof getCollegeLearnerProgressReport>>;

export function CollegeLearnerProgressReport({data}:{data:Result}){
 const {choices,report}=data;
 const [sectionId,setSectionId]=useState(report?.chosen.sectionId??"");
 const [offeringId,setOfferingId]=useState(report?.chosen.offeringId??"");
 const sections=new Map<string,string>();
 for(const choice of choices){
  sections.set(choice.sectionId,choice.sectionName+" ("+choice.sectionCode+") · "+choice.periodName);
 }
 const courses=choices.filter(option=>option.sectionId===sectionId);
 const deliveryId=courses.find(option=>option.offeringId===offeringId)?.deliveryId??"";
 return <section className="space-y-4 rounded-xl border border-border bg-surface p-5">
  <div>
   <h2 className="text-lg font-semibold text-foreground">Course Progress</h2>
   <p className="text-sm text-muted-foreground">
    See measured completion for a class and course, then focus on the students furthest behind.
   </p>
  </div>
  <form action="/college/course-progress" method="get" className="flex flex-wrap items-end gap-3">
   <label className="grid min-w-48 flex-1 gap-1 text-sm font-semibold text-body">Class
    <select value={sectionId} onChange={event=>{setSectionId(event.target.value);setOfferingId("");}}
     className="min-h-11 rounded-md border border-border bg-surface px-3">
     <option value="">Select Class</option>
     {[...sections].map(([id,name])=><option key={id} value={id}>{name}</option>)}
    </select>
   </label>
   <label className="grid min-w-48 flex-1 gap-1 text-sm font-semibold text-body">Course
    <select value={offeringId} onChange={event=>setOfferingId(event.target.value)}
     name="offeringId" disabled={!sectionId}
     className="min-h-11 rounded-md border border-border bg-surface px-3">
     <option value="">Select Course</option>
     {courses.map(item=><option key={item.offeringId} value={item.offeringId}>
      {item.courseCode} · {item.courseName}
     </option>)}
    </select>
   </label>
   <input type="hidden" name="deliveryId" value={deliveryId}/>
   <button type="submit" disabled={!deliveryId}
    className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-50">
    Show progress
   </button>
   <Link href="/college/course-progress"
    className="inline-flex min-h-11 items-center rounded border border-border px-3 text-sm font-semibold">
    Clear
   </Link>
  </form>
  {!report?<p className="text-sm text-muted-foreground">
   Select a Class and Course to see each enrolled learner’s progress.
  </p>:<>
   <dl className="grid gap-3 sm:grid-cols-4">
    {[
     ["Average completion",report.averageCompletion+"%"],
     ["Students",String(report.students)],
     ["Not started",String(report.notStarted)],
     ["Items measured",String(report.itemsMeasured)],
    ].map(([label,value])=><div key={label} className="rounded-lg border border-border p-3">
     <dt className="text-xs text-muted-foreground">{label}</dt>
     <dd className="mt-1 text-xl font-semibold tabular-nums">{value}</dd>
    </div>)}
   </dl>
   <Link prefetch={false} download
    href={"/api/courses/college/learner-progress/export?"+
     new URLSearchParams({offeringId:report.chosen.offeringId,deliveryId:report.chosen.deliveryId}).toString()}
    className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
    Export per-learner CSV
   </Link>
   <div className="overflow-x-auto">
    <table className="w-full min-w-[49rem] text-left text-sm">
     <thead className="bg-muted text-muted-foreground"><tr>
      <th scope="col" className="p-3">Student</th>
      <th scope="col" className="p-3">Roll number</th>
      <th scope="col" className="p-3">Videos</th>
      <th scope="col" className="p-3">Assignments</th>
      <th scope="col" className="p-3">Quizzes</th>
      <th scope="col" className="p-3">Progress</th>
     </tr></thead>
     <tbody>{report.rows.map(row=><tr key={row.membershipId} className="border-t border-border">
      <td className="p-3 font-semibold text-foreground">{row.name}</td>
      <td className="p-3">{row.rollNumber??"—"}</td>
      <td className="p-3 tabular-nums">{row.videoDone}/{report.totalVideos}</td>
      <td className="p-3 tabular-nums">{row.assignmentDone}/{report.totalAssignments}</td>
      <td className="p-3 tabular-nums">{row.quizDone}/{report.totalQuizzes}</td>
      <td className="p-3">
       <div className="flex items-center gap-2">
        <progress max={100} value={row.progress} className="w-24" aria-label={row.name+" progress"}/>
        <span className="tabular-nums">{row.progress}%</span>
       </div>
      </td>
     </tr>)}</tbody>
    </table>
    {!report.rows.length?<p className="p-3 text-sm text-muted-foreground">
     No active learner enrollments for this Class and Course.
    </p>:null}
   </div>
   <p className="text-xs text-muted-foreground">
    Published, visible videos and published assignments/quizzes are measured.
    Completion uses recorded video progress, assignment submissions and quiz attempts.
    {" "}Measured work only: videos watched to the end, assignments submitted, and quizzes attempted.
    Resources marked done by a student&apos;s own click are not included. A retaken quiz counts once per learner.
    {report.itemsMeasured===0?" No published items are available to measure.":""}
    {report.truncated?" Showing the first 2,000 enrolled learners; counts on this view are limited.":""}
   </p>
  </>}
 </section>;
}

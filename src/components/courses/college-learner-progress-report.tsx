import { Select } from "@/components/ui/select";
"use client";

import Link from "next/link";
import {useState} from "react";
import type {getCollegeLearnerProgressReport} from "@/modules/courses/college-learner-progress-service";
import {DataTable} from "@/components/ui/data-table";
import {EmptyState} from "@/components/ui/empty-state";

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
    <Select value={sectionId} onChange={event=>{setSectionId(event.target.value);setOfferingId("");}}
     className="min-h-11 rounded-md border border-border bg-surface px-3">
     <option value="">Select Class</option>
     {[...sections].map(([id,name])=><option key={id} value={id}>{name}</option>)}
    </Select>
   </label>
   <label className="grid min-w-48 flex-1 gap-1 text-sm font-semibold text-body">Course
    <Select value={offeringId} onChange={event=>setOfferingId(event.target.value)}
     name="offeringId" disabled={!sectionId}
     className="min-h-11 rounded-md border border-border bg-surface px-3">
     <option value="">Select Course</option>
     {courses.map(item=><option key={item.offeringId} value={item.offeringId}>
      {item.courseCode} · {item.courseName}
     </option>)}
    </Select>
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
   <DataTable
    caption="Course Progress by learner"
    rows={report.rows}
    getRowKey={row=>row.membershipId}
    empty={<EmptyState title="No enrolled learners" description="No active learner enrollments for this Class and Course." />}
    columns={[
     {key:"student",header:"Student",mobilePriority:"primary" as const,cell:(row)=><strong className="break-words text-foreground">{row.name}</strong>},
     {key:"roll",header:"Roll number",mobilePriority:"secondary" as const,cell:(row)=>row.rollNumber??"—"},
     {key:"progress",header:"Progress",mobilePriority:"secondary" as const,
      cell:(row)=><div className="flex flex-wrap items-center gap-2">
       <progress max={100} value={row.progress} className="w-24" aria-label={row.name+" progress"}/>
       <span className="tabular-nums">{row.progress}%</span>
      </div>},
     {key:"videos",header:"Videos",mobilePriority:"secondary" as const,cell:(row)=>row.videoDone+"/"+report.totalVideos},
     {key:"assignments",header:"Assignments",mobilePriority:"secondary" as const,cell:(row)=>row.assignmentDone+"/"+report.totalAssignments},
     {key:"quizzes",header:"Quizzes",mobilePriority:"secondary" as const,cell:(row)=>row.quizDone+"/"+report.totalQuizzes},
    ]}
   />
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

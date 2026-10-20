"use client";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import {useState} from "react";
import type {getCollegeLearnerProgressReport} from "@/modules/courses/college-learner-progress-service";
import {DataTable} from "@/components/ui/data-table";
import { MetricBar } from "@/components/ui/metric-bar";
import styles from "./college-learner-progress-report.module.css";
import { StatTile } from "@/components/ui/stat-tile";
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
 return <section className="space-y-4 border-b border-border pb-5">
  <div>
   <h2 className="text-lg font-semibold text-foreground">Course Progress</h2>
   <p className="text-sm text-muted-foreground">
    See measured completion for a class and course, then focus on the students furthest behind.
   </p>
  </div>
  <form action="/college/course-progress" method="get" className="flex flex-wrap items-end gap-3 print:hidden">
   <label className="grid min-w-0 w-full flex-1 gap-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)] md:min-w-48 md:w-auto">Class
    <Select value={sectionId} onChange={event=>{setSectionId(event.target.value);setOfferingId("");}}
     className="min-h-11 md:min-h-9">
     <option value="">Select Class</option>
     {[...sections].map(([id,name])=><option key={id} value={id}>{name}</option>)}
    </Select>
   </label>
   <label className="grid min-w-0 w-full flex-1 gap-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)] md:min-w-48 md:w-auto">Course
    <Select value={offeringId} onChange={event=>setOfferingId(event.target.value)}
     name="offeringId" disabled={!sectionId}
     className="min-h-11 md:min-h-9">
     <option value="">Select Course</option>
     {courses.map(item=><option key={item.offeringId} value={item.offeringId}>
      {item.courseCode} · {item.courseName}
     </option>)}
    </Select>
   </label>
   <Input type="hidden" name="deliveryId" value={deliveryId}/>
   <Button type="submit" disabled={!deliveryId}
    className="min-h-11 md:min-h-9">
    Show progress
   </Button>
   <Link href="/college/course-progress"
    className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-primary-text transition-colors hover:border-primary hover:bg-primary-subtle hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">
    Clear
   </Link>
  </form>
  {!report?<p className="text-sm text-muted-foreground">
   Select a Class and Course to see each enrolled learner’s progress.
  </p>:<>
   <div className="grid gap-3 md:grid-cols-4" role="group" aria-label="Class course progress summary">
    {[
     ["Average completion",report.averageCompletion+"%"],
     ["Students",String(report.students)],
     ["Not started",String(report.notStarted)],
     ["Items measured",String(report.itemsMeasured)],
    ].map(([label,value])=><StatTile key={label} label={label} value={value} className="p-3" />)}
   </div>
   <Link prefetch={false} download
    href={"/api/courses/college/learner-progress/export?"+
     new URLSearchParams({offeringId:report.chosen.offeringId,deliveryId:report.chosen.deliveryId}).toString()}
    className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text transition-colors hover:border-primary hover:bg-primary-subtle hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9 print:hidden">
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
      cell:(row)=><div className={styles.progressCell}>
       <MetricBar label={row.name+" progress"} role="progressbar" value={row.progress} maximum={100} unit="percent" className={styles.progressTrack} />
       <span className={styles.progressValue}>{row.progress}%</span>
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

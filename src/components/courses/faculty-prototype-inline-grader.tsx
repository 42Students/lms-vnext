"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {SubmissionGradeCard} from "./faculty-assignment-review";
import type {FacultySubmissionReviewRow} from "@/modules/courses/faculty-submission-review-model";

/** Presents the exact existing audited grading editor inline in the Faculty
 * prototype's selected-student pane, with optimistic stale-write guards intact.
 */
export function FacultyPrototypeInlineGrader({submission,maxPoints,filesEnabled,nextStudentHref=null}:{
 submission:FacultySubmissionReviewRow;maxPoints:number;filesEnabled:boolean;
 nextStudentHref?:string|null;
}){
 const router=useRouter();
 const [current,setCurrent]=useState(submission);
 const [busy,setBusy]=useState(false);
 return <section aria-label="Grade selected submission" aria-busy={busy}>
  <SubmissionGradeCard submission={current} maxPoints={maxPoints}
   filesEnabled={filesEnabled} hideSubmissionContent
   onBusyChange={setBusy} onUpdated={result=>{
    setCurrent(result);
    if(!nextStudentHref)router.refresh();
   }} onPublished={nextStudentHref?()=>router.push(nextStudentHref):undefined}
   onRefresh={()=>router.refresh()}/>
 </section>;
}

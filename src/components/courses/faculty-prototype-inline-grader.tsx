"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {SubmissionGradeCard} from "./faculty-assignment-review";
import type {FacultySubmissionReviewRow} from "@/modules/courses/faculty-submission-review-model";

/** Presents the exact existing audited grading editor inline in the Faculty
 * prototype's selected-student pane, with optimistic stale-write guards intact.
 */
export function FacultyPrototypeInlineGrader({submission,maxPoints,filesEnabled}:{
 submission:FacultySubmissionReviewRow;maxPoints:number;filesEnabled:boolean;
}){
 const router=useRouter();
 const [current,setCurrent]=useState(submission);
 const [busy,setBusy]=useState(false);
 return <section aria-label="Grade selected submission" aria-busy={busy}>
  <SubmissionGradeCard submission={current} maxPoints={maxPoints}
   filesEnabled={filesEnabled} hideSubmissionContent
   onBusyChange={setBusy} onUpdated={result=>{
    setCurrent(result);
    router.refresh();
   }} onRefresh={()=>router.refresh()}/>
 </section>;
}

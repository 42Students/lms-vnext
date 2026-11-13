"use client";

import { Heading } from "@/components/ui/heading";
import { useState, type ComponentType } from "react";
import G030 from "@/app/(authenticated)/college/batch-promotion/error";
import G031 from "@/app/(authenticated)/college/college-profile/error";
import G032 from "@/app/(authenticated)/college/courses/error";
import G033 from "@/app/(authenticated)/college/electives/[slotId]/allocate/error";
import G034 from "@/app/(authenticated)/college/groups/error";
import G035 from "@/app/(authenticated)/college/lecture-halls/[hallId]/error";
import G037 from "@/app/(authenticated)/college/placements/jobs/[jobId]/error";
import G038 from "@/app/(authenticated)/college/placements/new/error";
import G039 from "@/app/(authenticated)/college/projects/error";
import G040 from "@/app/(authenticated)/college/projects/audit/error";
import CollegeCourseProgressError from "@/app/(authenticated)/college/course-progress/error";
type Recovery = ComponentType<{error:Error & {digest?:string};reset:()=>void}>;
const examples: {id:string;label:string;Boundary:Recovery}[] = [
  {id:"G030",label:"Batch promotion",Boundary:G030},
  {id:"G031",label:"College profile",Boundary:G031},
  {id:"G032",label:"College courses",Boundary:G032},
  {id:"G033",label:"Elective allocation",Boundary:G033},
  {id:"G034",label:"Student groups",Boundary:G034},
  {id:"G035",label:"Lecture hall",Boundary:G035},
  {id:"G037",label:"Placement job",Boundary:G037},
  {id:"G038",label:"New placement",Boundary:G038},
  {id:"G039",label:"College projects",Boundary:G039},
  {id:"G040",label:"Project audit",Boundary:G040},
];
// Stable identity avoids retriggering the real error-boundary telemetry effect.
const syntheticError = new Error("Synthetic development-only route failure");
// These errors are synthetic. Their text and digest must never appear in the UI.
const privateCourseError = Object.assign(new Error("student@example.invalid access token sensitive-value"), {
  digest: "sensitive-digest-value",
});
const metadataCourseError = new Error("COURSE_PROGRESS_FILTERS_UNAVAILABLE");
export function UXTenCollegeRecoveryPreview() {
  const [counts,setCounts]=useState<Record<string,number>>({});
  return <div className="min-w-0 space-y-8">
    {examples.map(({id,label,Boundary})=><section key={id} aria-label={label+" recovery"} className="min-w-0 space-y-3 border-b border-border pb-6">
      <Heading level={2} className="text-lg font-semibold">{id} · {label}</Heading>
      <Boundary error={syntheticError} reset={()=>setCounts(previous=>({...previous,[id]:(previous[id]??0)+1}))}/>
      <p role="status">{id} retry count: {counts[id]??0}</p>
    </section>)}
    <section aria-label="Course progress unknown failure" className="min-w-0 space-y-3 border-b border-border pb-6">
      <Heading level={2} className="text-lg font-semibold">Course progress — unexpected failure</Heading>
      <CollegeCourseProgressError error={privateCourseError}
        reset={()=>setCounts(previous=>({...previous,unknownCourse:(previous.unknownCourse??0)+1}))}/>
      <p role="status">Unknown course retry count: {counts.unknownCourse??0}</p>
    </section>
    <section aria-label="Course progress metadata failure" className="min-w-0 space-y-3 border-b border-border pb-6">
      <Heading level={2} className="text-lg font-semibold">Course progress — metadata failure</Heading>
      <CollegeCourseProgressError error={metadataCourseError}
        reset={()=>setCounts(previous=>({...previous,metadataCourse:(previous.metadataCourse??0)+1}))}/>
      <p role="status">Metadata course retry count: {counts.metadataCourse??0}</p>
    </section>
  </div>;
}

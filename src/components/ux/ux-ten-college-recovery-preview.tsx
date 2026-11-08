"use client";
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
export function UXTenCollegeRecoveryPreview() {
  const [counts,setCounts]=useState<Record<string,number>>({});
  return <div className="min-w-0 space-y-8">
    {examples.map(({id,label,Boundary})=><section key={id} aria-label={label+" recovery"} className="min-w-0 space-y-3 border-b border-border pb-6">
      <h2 className="text-lg font-semibold">{id} · {label}</h2>
      <Boundary error={syntheticError} reset={()=>setCounts(previous=>({...previous,[id]:(previous[id]??0)+1}))}/>
      <p role="status">{id} retry count: {counts[id]??0}</p>
    </section>)}
  </div>;
}

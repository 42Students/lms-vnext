"use client";

import { Heading } from "@/components/ui/heading";
import { useState, type ComponentType } from "react";
import G030 from "@/app/(authenticated)/college/batch-promotion/error";
import G031 from "@/app/(authenticated)/college/companies/error";
import G032 from "@/app/(authenticated)/college/courses/offerings/[offeringId]/error";
import G033 from "@/app/(authenticated)/college/electives/[slotId]/offerings/[offeringId]/roster/error";
import G034 from "@/app/(authenticated)/college/groups/[groupId]/import-preview/error";
import G035 from "@/app/(authenticated)/college/lecture-halls/[hallId]/error";
import G037 from "@/app/(authenticated)/college/placements/jobs/[jobId]/applications/error";
import G038 from "@/app/(authenticated)/college/placements/readiness-by-department/error";
import G039 from "@/app/(authenticated)/college/projects/[projectId]/[section]/error";
import G040 from "@/app/(authenticated)/college/projects/audit/error";

type Recovery = ComponentType<{error: Error & {digest?: string}; reset: () => void}>;
const rows: {id:string;Boundary:Recovery}[] = [
  {id:"UX-G030",Boundary:G030},
  {id:"UX-G031",Boundary:G031},
  {id:"UX-G032",Boundary:G032},
  {id:"UX-G033",Boundary:G033},
  {id:"UX-G034",Boundary:G034},
  {id:"UX-G035",Boundary:G035},
  {id:"UX-G037",Boundary:G037},
  {id:"UX-G038",Boundary:G038},
  {id:"UX-G039",Boundary:G039},
  {id:"UX-G040",Boundary:G040},
];
const syntheticError = Object.assign(new Error("Private fixture error: tenant-secret-should-not-render"), {
  digest: "private-error-digest-should-not-render",
});

/** Actual 2026-11-09 atomic slice boundaries, not parent-group stand-ins. */
export function UXTenCollegeAtomicRecoveryPreview() {
  const [counts,setCounts]=useState<Record<string,number>>({});
  return <section aria-label="Atomic College Admin recovery" className="min-w-0 space-y-6">
    <Heading level={2} className="text-xl font-semibold">Atomic College Admin route recovery</Heading>
    {rows.map(({id,Boundary})=><section key={id} aria-label={id+" atomic recovery"}
      className="min-w-0 space-y-3 border-b border-border pb-5">
      <Heading level={3} className="text-sm font-semibold">{id}</Heading>
      <Boundary error={syntheticError}
        reset={()=>setCounts(current=>({...current,[id]:(current[id]??0)+1}))}/>
      <p role="status">{id} retry count: {counts[id]??0}</p>
    </section>)}
  </section>;
}

"use client";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
export default function FacultyAssignmentReportError({reset}:{error:Error&{digest?:string};reset:()=>void}) {
 return <section role="alert" className="min-w-0 space-y-4">
  <PageHeader title="Assignment report unavailable" />
  <p className="max-w-prose text-sm text-body leading-[22px]">Couldn&apos;t load the assignment report. Please try again. A roster-only error is shown as a partial-report warning when the report itself can still be opened.</p>
  <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
   <Button onClick={reset} className="w-full sm:w-auto">Try again</Button>
   <ButtonLink variant="secondary" href="/teacher/allAssignments" className="w-full sm:w-auto">Back to all assignments</ButtonLink>
  </div>
 </section>;
}

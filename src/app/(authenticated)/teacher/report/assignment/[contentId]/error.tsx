"use client";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
export default function FacultyAssignmentReportError({reset}:{error:Error&{digest?:string};reset:()=>void}) {
 return <section role="alert" className="min-w-0 space-y-4">
  <PageHeader title="Assignment report unavailable" />
  <p className="max-w-prose text-sm text-body leading-[22px]">Couldn\'t load the assignment report. Please try again. A roster-only error is shown as a partial-report warning when the report itself can still be opened.</p>
  <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
   <Button onClick={reset} className="w-full sm:w-auto">Try again</Button>
   <Link href="/teacher/allAssignments" className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary-text)] sm:w-auto md:min-h-9">Back to all assignments</Link>
  </div>
 </section>;
}

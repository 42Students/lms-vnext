"use client";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
export default function FacultyAssignmentReportError({reset}:{error:Error&{digest?:string};reset:()=>void}) {
 return <section role="alert" className="min-w-0 space-y-4">
  <PageHeader title="Unable to load Assignment Report" />
  <p className="max-w-prose text-sm leading-6 text-body">We could not load the report. Check that you still have an active teaching assignment for this Section.</p>
  <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
   <Button onClick={reset} className="w-full sm:w-auto">Retry report</Button>
   <Link href="/teacher/allAssignments" className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary-text)] sm:w-auto md:min-h-9">Back to all assignments</Link>
  </div>
 </section>;
}

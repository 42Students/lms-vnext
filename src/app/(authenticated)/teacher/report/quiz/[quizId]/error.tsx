"use client";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
export default function FacultyQuizReportError({reset}:{error:Error&{digest?:string};reset:()=>void}) {
 return <section role="alert" className="min-w-0 space-y-4">
 <PageHeader title="Unable to load Quiz Report" />
 <p className="max-w-prose text-sm leading-6 text-body">We could not load the report. Check that you still have an active teaching assignment for this Section.</p>
 <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
  <Button type="button" onClick={reset} className="w-full sm:w-auto">Retry report</Button>
  <ButtonLink variant="secondary" href="/teacher/allQuizzes" className="w-full sm:w-auto">Back to all quizzes</ButtonLink>
 </div>
 </section>;
}

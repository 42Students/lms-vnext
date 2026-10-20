"use client";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function LearnerAssignmentDetailError({reset}:{
  error: Error & {digest?:string}; reset:()=>void;
}) {
  return <div className="min-w-0 space-y-4">
    <PageHeader title={"Could not load assignment"} />
    <Alert tone="error">A load failure is not treated as an empty assignment.</Alert>
    <div className="flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
      <Button className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={reset}>Retry</Button>
      <Link href="/learn/allAssignments" className="inline-flex min-h-11 w-full items-center justify-center text-sm font-semibold text-primary-text hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] sm:w-auto md:min-h-9">All Assignments</Link>
    </div>
  </div>;
}
"use client";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TextLink } from "@/components/ui/text-link";
export default function LearnerAssignmentDetailError({reset}:{
  error: Error & {digest?:string}; reset:()=>void;
}) {
  return <div className="min-w-0 space-y-4">
    <PageHeader title={"Could not load assignment"} />
    <Alert tone="error">A load failure is not treated as an empty assignment.</Alert>
    <div className="flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
      <Button className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={reset}>Retry</Button>
      <TextLink href="/learn/allAssignments" className="inline-flex min-h-11 w-full items-center justify-center text-sm sm:w-auto md:min-h-9">All Assignments</TextLink>
    </div>
  </div>;
}
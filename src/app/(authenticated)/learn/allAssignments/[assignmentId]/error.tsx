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
    <div className="flex flex-wrap items-center gap-3">
      <Button className="min-h-11 md:min-h-9" onClick={reset}>Retry</Button>
      <Link href="/learn/allAssignments" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text md:min-h-9">All Assignments</Link>
    </div>
  </div>;
}
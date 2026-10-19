"use client";
import { PageHeader } from "@/components/ui/page-header";
import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function LearnerAssignmentDetailError({reset}:{
  error: Error & {digest?:string}; reset:()=>void;
}) {
  return <div className="py-6 text-center">
    <PageHeader title={"Could not load assignment"} />
    <p className="mt-2 text-sm text-body">A load failure is not treated as an empty assignment.</p>
    <div className="mt-4 flex flex-wrap justify-center gap-3">
      <Button onClick={reset}>Retry</Button>
      <Link href="/learn/allAssignments" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text sm:min-h-9">All Assignments</Link>
    </div>
  </div>;
}
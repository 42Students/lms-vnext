"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function LearnerAssignmentDetailError({reset}:{
  error: Error & {digest?:string}; reset:()=>void;
}) {
  return <div className="rounded-xl border border-border bg-surface p-6 text-center">
    <h1 className="text-lg font-semibold text-foreground">Could not load assignment</h1>
    <p className="mt-2 text-sm text-body">A load failure is not treated as an empty assignment.</p>
    <div className="mt-4 flex flex-wrap justify-center gap-3">
      <Button onClick={reset}>Retry</Button>
      <Link href="/learn/allAssignments" className="inline-flex min-h-10 items-center text-primary-text">All Assignments</Link>
    </div>
  </div>;
}
"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
export default function CollegeOfferingError({reset}:{error:Error&{digest?:string};reset:()=>void}) {
  return <ErrorState title="Course details could not be loaded"
    description="This is a loading problem, not a missing course. Check your connection and try again."
    action={<div className="flex min-w-0 flex-wrap gap-3">
      <Button type="button" variant="secondary" onClick={reset} className="min-h-11 md:min-h-9">Retry</Button>
      <Link href="/college/courses" className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">Back to Courses</Link>
    </div>}/>;
}

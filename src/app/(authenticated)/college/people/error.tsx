"use client";
import Link from "next/link";
import {Button} from "@/components/ui/button";
import {ErrorState} from "@/components/ui/error-state";
export default function CollegePeopleError({reset}:{error:Error&{digest?:string};reset:()=>void}) {
  return <ErrorState title="People directory unavailable"
    description="No membership data could be loaded. Retry or clear filters."
    action={<div className="flex min-w-0 flex-wrap gap-3">
      <Button type="button" variant="secondary" onClick={reset}>Retry</Button>
      <Link href="/college/people/manage"
        className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius,9px)] border border-border px-4 text-sm font-semibold text-[var(--lms-teal-deep)] underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]">Clear filters</Link>
    </div>} />;
}

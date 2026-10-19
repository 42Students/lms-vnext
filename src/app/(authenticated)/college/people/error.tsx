"use client";
import Link from "next/link";
import {Button} from "@/components/ui/button";
import {ErrorState} from "@/components/ui/error-state";
export default function CollegePeopleError({reset}:{error:Error&{digest?:string};reset:()=>void}) {
  return <ErrorState title="People directory unavailable"
    description="No membership data could be loaded. Retry or clear filters."
    action={<div className="flex min-w-0 flex-wrap gap-3">
      <Button type="button" variant="secondary" onClick={reset} className="min-h-11 md:min-h-9">Retry</Button>
      <Link href="/college/people/manage"
        className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">Clear filters</Link>
    </div>} />;
}

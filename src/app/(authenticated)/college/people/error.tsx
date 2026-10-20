"use client";
import Link from "next/link";
import {Button} from "@/components/ui/button";
import {ErrorState} from "@/components/ui/error-state";
export default function CollegePeopleError({reset}:{error:Error&{digest?:string};reset:()=>void}) {
  return <ErrorState title="People directory unavailable"
    description="No membership data could be loaded. Retry or clear filters."
    action={<div className="flex w-full min-w-0 flex-col gap-[var(--lms-space-3)] sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
      <Button type="button" variant="secondary" onClick={reset} className="min-h-11 w-full sm:w-auto md:min-h-9">Retry</Button>
      <Link href="/college/contacts"
        className="inline-flex min-h-11 w-full items-center justify-center font-semibold sm:w-auto text-link underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Clear filters</Link>
    </div>} />;
}

"use client";
import {Button} from "@/components/ui/button";
import {ErrorState} from "@/components/ui/error-state";
import { TextLink } from "@/components/ui/text-link";
export default function CollegePeopleError({reset}:{error:Error&{digest?:string};reset:()=>void}) {
  return <ErrorState title="People directory unavailable"
    description="No membership data could be loaded. Retry or clear filters."
    action={<div className="flex w-full min-w-0 flex-col gap-[var(--lms-space-3)] sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
      <Button type="button" variant="secondary" onClick={reset} className="min-h-11 w-full sm:w-auto md:min-h-9">Retry</Button>
      <TextLink href="/college/contacts"
        className="inline-flex min-h-11 w-full items-center justify-center sm:w-auto md:min-h-9">Clear filters</TextLink>
    </div>} />;
}

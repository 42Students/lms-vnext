"use client";
import Link from "next/link";
import {Button} from "@/components/ui/button";
import {ErrorState} from "@/components/ui/error-state";
export default function LearnerCalendarError({reset}:{error:Error&{digest?:string};reset:()=>void}){
  return <ErrorState title="Could not load your career calendar"
    description="Your schedule could not be retrieved. This does not mean you have no events. Retry to reload the selected calendar view."
    action={<div className="flex flex-wrap justify-center gap-3">
      <Button className="min-h-11" variant="secondary" onClick={reset}>Retry</Button>
      <Link href="/learn/my-placements" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle sm:min-h-9">My Placements</Link>
    </div>} />;
}

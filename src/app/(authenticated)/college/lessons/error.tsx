"use client";

import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function CollegeLessonsError({ error, reset }: {
  error: Error & { digest?: string;
    failedCourseSources?: number; totalCourseSources?: number };
  reset: () => void;
}) {
  const failures=error.failedCourseSources;
  const total=error.totalCourseSources;
  // Next error boundaries receive sanitized error objects. Only surface
  // bounded, explicitly populated source counts; never parse an internal
  // stack trace or claim partial rows remain mounted under the boundary.
  const diagnosed=Number.isSafeInteger(failures) &&
    Number.isSafeInteger(total) && failures!==undefined &&
    total!==undefined && failures>0 && failures<=total && total<=1000;
  const detail=diagnosed
    ? failures+" of "+total+" course source(s) failed to load. The previous lesson list is not retained here. Retry to restore the complete list."
    : "The lesson list could not be refreshed. This does not mean there are no lessons; try again without changing filters.";
  // An error boundary does not retain the previous successful lesson rows.
  // Do not claim that stale rows are visible until the list-level reader can
  // preserve its last verified per-scope response.
  return <ErrorState title="Couldn't refresh lessons"
    description={detail}
    action={<div className="flex flex-wrap items-center gap-3">
      <Button type="button" variant="secondary" onClick={reset}>Retry</Button>
      <Link href="/college/lessons" className="text-sm font-semibold text-primary-text underline">
        Return to lessons</Link>
    </div>} />;
}

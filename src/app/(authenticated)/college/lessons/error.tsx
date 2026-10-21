"use client";

import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function CollegeLessonsError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // An error boundary does not retain the previous successful lesson rows.
  // Do not claim that stale rows are visible until the list-level reader can
  // preserve its last verified per-scope response.
  return <ErrorState title="Couldn't refresh lessons"
    description="The lesson list could not be refreshed. This does not mean there are no lessons; try again without changing filters."
    action={<div className="flex flex-wrap items-center gap-3">
      <Button type="button" variant="secondary" onClick={reset}>Retry</Button>
      <Link href="/college/lessons" className="text-sm font-semibold text-primary-text underline">
        Return to lessons</Link>
    </div>} />;
}

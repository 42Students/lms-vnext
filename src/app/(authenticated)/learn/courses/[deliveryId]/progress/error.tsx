"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function LearnerCourseDrilldownError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Could not load course progress"
      description="The authorized course records could not be loaded. This does not mean the learner has no data."
      action={
        <div className="flex flex-wrap justify-center gap-3">
          <Button variant="secondary" className="min-h-11 md:min-h-9" onClick={reset}>Retry</Button>
          <Link href="/learn/courses"
            className="inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-body">
            Courses
          </Link>
        </div>
      }
    />
  );
}

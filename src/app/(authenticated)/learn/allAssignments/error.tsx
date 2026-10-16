"use client";
import { LEARNER_BACK_TO_COURSES } from "@/modules/courses/learner-course-copy-model";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LearnerAssessmentsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-8 text-center">
      <h1 className="m-0 text-xl font-semibold text-foreground">Assignments could not be loaded</h1>
      <p className="mt-2 text-sm text-body">
        This is a loading problem, not an empty list. Check your connection and try again.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <Link href="/learn/courses" className="inline-flex min-h-10 items-center text-sm font-semibold text-primary-text">
          {LEARNER_BACK_TO_COURSES}
        </Link>
      </div>
    </div>
  );
}

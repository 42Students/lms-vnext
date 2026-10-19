"use client";
import { ErrorState } from "@/components/ui/error-state";
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
    <ErrorState title={"Could not load this page"} description={"The assessment list failed to load. This is not treated as an empty list."}
      action={<div className="flex flex-wrap items-center gap-3"><Button onClick={reset}>Try again</Button><Link href="/learn/courses" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text sm:min-h-9">
          {LEARNER_BACK_TO_COURSES}
        </Link></div>} />
  );
}

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
    <div className="py-8 text-center">
      <h1 className="m-0 font-semibold text-[var(--lms-heading)] text-[30px] leading-9">Could not load this page</h1>
      <p className="mt-2 text-sm text-body">
        The assessment list failed to load. This is not treated as an empty list.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <Link href="/learn/courses" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text sm:min-h-9">
          {LEARNER_BACK_TO_COURSES}
        </Link>
      </div>
    </div>
  );
}

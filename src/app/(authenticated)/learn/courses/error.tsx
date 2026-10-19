"use client";
import { ErrorState } from "@/components/ui/error-state";
import { LEARNER_BACK_TO_COURSES } from "@/modules/courses/learner-course-copy-model";

import { Button } from "@/components/ui/button";
import {usePathname} from "next/navigation";
import Link from "next/link";

export default function LearnerCoursesError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname=usePathname();
  const isList=pathname==="/learn/courses";
  return (
    <ErrorState
      title={isList ? "Failed to load courses. Please try again." : "Could not load course lessons"}
      description={isList
        ? "Check your connection and try again. Your courses have not been changed."
        : "This course may not exist or you may not have access. Please try again or return to your courses."}
      action={<div className="flex flex-wrap items-center gap-2">
        <Button onClick={reset}>{isList ? "Try again" : "Retry"}</Button>
        <Link href="/learn/courses"
          className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-primary-text hover:bg-primary-subtle sm:min-h-9">
          {LEARNER_BACK_TO_COURSES}
        </Link>
      </div>}
    />
  );
}

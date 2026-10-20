"use client";
import { LEARNER_BACK_TO_COURSES } from "@/modules/courses/learner-course-copy-model";

import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
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
    <div className="min-w-0 space-y-4">
      <PageHeader title={isList ? "Failed to load courses. Please try again." : "Could not load course lessons"} />
      <Alert tone="error">
        {isList?"Check your connection and try again. Your courses have not been changed.":"This course may not exist or you may not have access. Please try again or return to your courses."}
      </Alert>
      <div className="flex flex-wrap items-center gap-2">
        <Button className="min-h-11 md:min-h-9" onClick={reset}>{isList?"Try again":"Retry"}</Button>
        <Link
          href="/learn/courses"
          className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-primary-text md:min-h-9 hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]"
        >
          {LEARNER_BACK_TO_COURSES}
        </Link>
      </div>
    </div>
  );
}

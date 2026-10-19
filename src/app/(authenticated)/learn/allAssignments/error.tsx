"use client";
import { PageHeader } from "@/components/ui/page-header";
import { LEARNER_BACK_TO_COURSES } from "@/modules/courses/learner-course-copy-model";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

export default function LearnerAssessmentsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-w-0 space-y-4">
      <PageHeader title={"Assignments could not be loaded"} />
      <Alert tone="error">
        This is a loading problem, not an empty list. Check your connection and try again.
      </Alert>
      <div className="flex flex-wrap items-center gap-3">
        <Button className="min-h-11 md:min-h-9" onClick={reset}>Retry</Button>
        <Link href="/learn/courses" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text md:min-h-9">
          {LEARNER_BACK_TO_COURSES}
        </Link>
      </div>
    </div>
  );
}

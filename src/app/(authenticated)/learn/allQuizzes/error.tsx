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
      <PageHeader title={"Could not load this page"} />
      <Alert tone="error">
        The assessment list failed to load. This is not treated as an empty list.
      </Alert>
      <div className="flex flex-wrap items-center gap-3">
        <Button className="min-h-11 md:min-h-9" onClick={reset}>Try again</Button>
        <Link href="/learn/courses" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text md:min-h-9">
          {LEARNER_BACK_TO_COURSES}
        </Link>
      </div>
    </div>
  );
}

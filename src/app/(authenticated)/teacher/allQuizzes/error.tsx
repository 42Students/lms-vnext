"use client";

import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";

export default function FacultyQuizzesOverviewError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="min-w-0 space-y-4">
      <PageHeader title={"Failed to load quizzes. Please try again."} />
      <p className="max-w-xl text-sm leading-6 text-body">
        We could not load your teaching quizzes. The previous assessment list was not silently replaced with an empty result.
      </p>
      <div className="flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        <Button onClick={reset}>Retry</Button>
        <ButtonLink variant="secondary" href="/teacher/courses">
          My teaching Courses
        </ButtonLink>
      </div>
    </section>
  );
}

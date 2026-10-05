"use client";

import { Button } from "@/components/ui/button";

export default function LearnerCoursesError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-8 text-center">
      <h1 className="m-0 text-xl font-semibold text-foreground">
        Could not load course
      </h1>
      <p className="mt-2 text-sm text-body">
        This course may be unavailable, or the request may have failed. Try again or return to Courses.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Button onClick={reset}>Try again</Button>
        <a
          href="/learn/courses"
          className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-3 text-sm font-semibold text-foreground"
        >
          Back to Courses
        </a>
      </div>
    </div>
  );
}

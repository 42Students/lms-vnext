"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function FacultyQuizReportError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="rounded-xl border border-border bg-surface px-6 py-10 text-center">
      <h1 className="text-lg font-semibold text-foreground">Unable to load Quiz Report</h1>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-body">
        We could not load the report. Check that you still have an active teaching assignment for this Section.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>Retry report</Button>
        <Link
          href="/teacher/allQuizzes"
          className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text"
        >
          Back to all quizzes
        </Link>
      </div>
    </section>
  );
}

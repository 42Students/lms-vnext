"use client";

import { PageHeader } from "@/components/ui/page-header";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function FacultyQuizzesOverviewError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="min-w-0 border-b border-border bg-transparent py-[var(--lms-space-5)]">
      <PageHeader title={"Failed to load quizzes. Please try again."} />
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-body">
        We could not load your teaching quizzes. The previous assessment list was not silently replaced with an empty result.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Button variant="secondary" onClick={reset}>Retry</Button>
        <Link href="/teacher/courses" className="inline-flex min-h-10 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-primary-text">
          My teaching Courses
        </Link>
      </div>
    </section>
  );
}

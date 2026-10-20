"use client";

import { PageHeader } from "@/components/ui/page-header";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function FacultyAssignmentsOverviewError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="min-w-0 space-y-4">
      <PageHeader title={"Assignments could not be loaded"} />
      <p className="max-w-xl text-sm leading-6 text-body">
        This is a loading problem, not an empty list. Try again to load your teaching assignments.
      </p>
      <div className="flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        <Button onClick={reset}>Retry</Button>
        <Link href="/teacher/courses" className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">
          My teaching Courses
        </Link>
      </div>
    </section>
  );
}

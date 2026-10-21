"use client";

import { PageHeader } from "@/components/ui/page-header";
import {Alert} from "@/components/ui/alert";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function FacultyClassScheduleError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="min-w-0 space-y-4">
      <PageHeader title="Class Schedule" />
      <Alert tone="error" title="Unable to load class schedule. Please try again.">
        The schedule could not be refreshed. Retry the schedule or return to Courses without changing any saved classes.
      </Alert>
      <div className="flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        <Button onClick={reset}>Retry class schedule</Button>
        <Link href="/teacher/courses" className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">
          Back to courses
        </Link>
      </div>
    </section>
  );
}

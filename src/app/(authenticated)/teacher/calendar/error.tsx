"use client";

import { PageHeader } from "@/components/ui/page-header";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function FacultyClassScheduleError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section role="alert" className="min-w-0 border-b border-border bg-transparent py-[var(--lms-space-5)]">
      <PageHeader title={"Unable to load Class Schedule"} />
      <p className="mt-2 text-sm text-body">
        This Faculty page could not load. Retry to recheck current access.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Button variant="secondary" onClick={reset}>Retry</Button>
        <Link href="/teacher/courses" className="inline-flex min-h-10 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-primary-text">
          Back to courses
        </Link>
      </div>
    </section>
  );
}

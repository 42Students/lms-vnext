"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function FacultyAssignmentsOverviewError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="rounded-xl border border-border bg-surface px-6 py-10 text-center">
      <h1 className="text-lg font-semibold text-foreground">Could not load assignments</h1>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-body">
        We could not load your teaching assignments. The previous assessment list was not silently replaced with an empty result.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>Retry</Button>
        <Link href="/teach/courses" className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
          My teaching Courses
        </Link>
      </div>
    </section>
  );
}

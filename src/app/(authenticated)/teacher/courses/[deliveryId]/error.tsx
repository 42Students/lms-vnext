"use client";
import { PageHeader } from "@/components/ui/page-header";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function FacultyCourseError({ error, reset }: {
  error: Error & { digest?: string }; reset: () => void;
}) {
  // Error boundaries may receive opaque server digests; never expose those.
  // Distinguish permission failures only when a trusted code survived.
  const accessDenied = error.message === "FACULTY_TEACHING_SCOPE_REQUIRED" ||
    error.message === "FACULTY_ACCESS_DENIED" ||
    error.message === "FORBIDDEN";
  return (
    <section className="min-w-0 space-y-4">
      <PageHeader title={accessDenied ? "Faculty access required" : "Could not load teacher course context"} />
      <p className="mt-2 text-sm text-body">
        {accessDenied
          ? "Sign in with a Faculty account to open this course."
          : "Please retry. If this continues, your course assignment may be missing or unavailable."}
      </p>
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
        {!accessDenied ? <Button onClick={reset}>Try again</Button> : null}
        <Link href="/teacher/courses" className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">Back to Courses</Link>
      </div>
    </section>
  );
}

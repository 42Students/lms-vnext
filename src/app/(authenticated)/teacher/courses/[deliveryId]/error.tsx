"use client";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";

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
        <ButtonLink variant="secondary" href="/teacher/courses">Back to Courses</ButtonLink>
      </div>
    </section>
  );
}

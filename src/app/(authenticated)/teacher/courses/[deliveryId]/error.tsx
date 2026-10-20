"use client";
import { PageHeader } from "@/components/ui/page-header";
import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function FacultyCourseError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="min-w-0 space-y-4">
      <PageHeader title={"Unable to load Faculty Course"} />
      <p className="mt-2 text-sm text-body">The teaching assignment may have changed or this request failed.</p>
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
        <Button onClick={reset}>Retry</Button>
        <Link href="/teacher/courses" className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">Back to Courses</Link>
      </div>
    </section>
  );
}

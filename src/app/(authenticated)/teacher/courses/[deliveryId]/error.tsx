"use client";
import { PageHeader } from "@/components/ui/page-header";
import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function FacultyCourseError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="min-w-0 border-b border-border bg-transparent py-[var(--lms-space-5)]">
      <PageHeader title={"Unable to load Faculty Course"} />
      <p className="mt-2 text-sm text-body">The teaching assignment may have changed or this request failed.</p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Button variant="secondary" onClick={reset}>Retry</Button>
        <Link href="/teacher/courses" className="inline-flex min-h-10 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-primary-text">Back to Courses</Link>
      </div>
    </section>
  );
}

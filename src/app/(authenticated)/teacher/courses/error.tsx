"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function FacultyCoursesError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="rounded-xl border border-border bg-surface px-6 py-10 text-center">
      <h1 className="font-semibold text-[30px] text-[var(--lms-heading)]">Failed to load courses. Please try again.</h1>
      <p className="mt-2 text-sm text-body">We couldn\&apos;t load the teaching courses. Your assignments may have changed. Try again.</p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>Retry</Button>
        <Link href="/teacher/courses" className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Back to Courses</Link>
      </div>
    </section>
  );
}

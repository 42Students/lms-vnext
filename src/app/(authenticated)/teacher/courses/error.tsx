"use client";
import { PageHeader } from "@/components/ui/page-header";
import { PageBackLink } from "@/components/ui/page-back-link";
import { Button } from "@/components/ui/button";
export default function FacultyCoursesError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="space-y-3 py-6">
      <PageHeader title={"Failed to load courses. Please try again."} />
      <p className="mt-2 text-sm text-body">We couldn&apos;t load the teaching courses. Your assignments may have changed. Try again.</p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>Retry</Button>
        <PageBackLink href="/teacher/courses" label="Back to Courses" />
      </div>
    </section>
  );
}

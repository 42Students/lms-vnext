"use client";
import { PageHeader } from "@/components/ui/page-header";
import { PageBackLink } from "@/components/ui/page-back-link";
import { Button } from "@/components/ui/button";
export default function FacultyCoursesError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="min-w-0 space-y-4">
      <PageHeader title={"Failed to load courses. Please try again."} />
      <p role="alert" className="mt-2 text-sm text-body">We couldn&apos;t load the teaching courses. Your assignments may have changed. Try again.</p>
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
        <Button type="button" onClick={reset} className="min-h-11 w-full sm:w-auto md:min-h-9">Retry</Button>
        <PageBackLink href="/teacher" label="Faculty home" />
      </div>
    </section>
  );
}

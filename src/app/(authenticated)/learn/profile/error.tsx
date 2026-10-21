"use client";
import { PageHeader } from "@/components/ui/page-header";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LearnerProfileError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section role="alert" className="min-w-0 space-y-4">
      <PageHeader title="We couldn't load your profile. Please try again." />
      <p className="mt-2 max-w-2xl text-sm leading-6 text-body">
        We couldn't load your profile. Please try again. Your previously saved details were not overwritten.
      </p>
      <div className="mt-4 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
        <Button type="button" className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={reset}>Retry</Button>
        <Link href="/learn/courses" className="inline-flex min-h-11 w-full items-center justify-center sm:w-auto md:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] px-4 text-sm font-[650] text-[var(--lms-link-text)] hover:underline">Courses</Link>
      </div>
    </section>
  );
}

"use client";
import { PageHeader } from "@/components/ui/page-header";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LearnerJobDetailError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section role="alert" className="min-w-0 space-y-4">
      <PageHeader title={"Unable to load this drive"} />
      <p className="mt-2 text-sm text-body">
        Drive information could not be loaded. This is different from an unavailable or removed job.
      </p>
      <div className="mt-4 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
        <Button className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={reset}>Retry</Button>
        <Link href="/learn/my-placements/jobs"
          className="inline-flex min-h-11 w-full items-center justify-center sm:w-auto rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#1a95a1] md:min-h-9">
          Back to Drives
        </Link>
      </div>
    </section>
  );
}

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
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button className="max-md:min-h-11" onClick={reset}>Retry</Button>
        <Link href="/learn/my-placements/jobs"
          className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">
          Back to Drives
        </Link>
      </div>
    </section>
  );
}

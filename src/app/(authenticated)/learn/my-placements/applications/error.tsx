"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function LearnerApplicationsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Could not load applications"
      description="Your application records could not be retrieved. A loading failure does not mean your applications are empty or withdrawn."
      action={
        <div className="flex w-full min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
          <Button className="min-h-11 w-full sm:w-auto md:min-h-9" variant="secondary" onClick={reset}>Retry</Button>
          <Link href="/learn/my-placements"
            className="inline-flex min-h-11 w-full items-center justify-center sm:w-auto md:min-h-9 rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-primary-text">
            Back to My Placements
          </Link>
        </div>
      }
    />
  );
}

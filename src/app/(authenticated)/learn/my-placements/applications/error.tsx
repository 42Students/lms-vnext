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
        <div className="flex flex-wrap justify-center gap-3">
          <Button variant="secondary" onClick={reset}>Retry</Button>
          <Link href="/learn/my-placements"
            className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
            Back to My Placements
          </Link>
        </div>
      }
    />
  );
}

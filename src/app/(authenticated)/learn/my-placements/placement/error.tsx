"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function LearnerPlacementCellError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Could not load placement cell"
      description="Offers, requests or placement alerts could not be retrieved. A failed read must not appear as an empty list."
      action={<div className="flex min-w-0 flex-wrap items-center gap-3">
        <Button className="max-md:min-h-11" variant="secondary" onClick={reset}>Retry</Button>
        <Link href="/learn/my-placements"
          className="inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-primary-text">
          Placements dashboard
        </Link>
      </div>}
    />
  );
}

"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function LearnerNotificationHistoryError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Could not load notification history"
      description="The requested notification page could not be retrieved. This does not mean your history is empty."
      action={<div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:justify-center sm:gap-3">
        <Button variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={reset}>Retry</Button>
        <Link href="/learn/notifications" className="inline-flex min-h-11 w-full items-center justify-center sm:w-auto md:min-h-9 rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-primary-text">
          Notifications
        </Link>
      </div>}
    />
  );
}

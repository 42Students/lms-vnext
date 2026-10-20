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
      action={<div className="flex flex-wrap justify-center gap-3">
        <Button variant="secondary" onClick={reset}>Retry</Button>
        <Link href="/learn/notifications" className="inline-flex min-h-11 min-[768px]:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-primary-text">
          Notifications
        </Link>
      </div>}
    />
  );
}

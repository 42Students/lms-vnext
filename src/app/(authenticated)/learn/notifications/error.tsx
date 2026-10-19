"use client";
import { ErrorState } from "@/components/ui/error-state";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LearnerNotificationsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState title={"Unable to load notifications"} description={"Your notifications could not be loaded. Try again, or return to your dashboard."}
      action={<div className="flex flex-wrap items-center gap-3"><Button onClick={reset}>Retry</Button><Link href="/learn" className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle sm:min-h-9">
          Learner Home
        </Link></div>} />
  );
}

"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LearnerNotificationsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section role="alert" className="rounded-xl border border-border bg-surface p-8 text-center">
      <h1 className="m-0 text-xl font-semibold text-foreground">
        Unable to load notifications
      </h1>
      <p className="mt-2 text-sm text-body">
        Your notifications could not be loaded. Try again, or return to your dashboard.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>Retry</Button>
        <Link href="/learn" className="inline-flex min-h-10 items-center justify-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-primary-text">
          Learner Home
        </Link>
      </div>
    </section>
  );
}

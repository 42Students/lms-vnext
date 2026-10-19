"use client";
import { PageHeader } from "@/components/ui/page-header";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LearnerNotificationsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section role="alert" className="py-8 text-center">
      <PageHeader title={"Unable to load notifications"} />
      <p className="mt-2 text-sm text-body">
        Your notifications could not be loaded. Try again, or return to your dashboard.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>Retry</Button>
        <Link href="/learn" className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle sm:min-h-9">
          Learner Home
        </Link>
      </div>
    </section>
  );
}

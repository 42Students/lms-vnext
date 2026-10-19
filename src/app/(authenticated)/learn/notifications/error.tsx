"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

export default function LearnerNotificationsError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <section className="min-w-0 space-y-4">
    <PageHeader title="Unable to load notifications" />
    <Alert tone="error">
      <p>Your notifications could not be loaded. Try again, or return to your dashboard.</p>
      <div className="flex flex-wrap gap-3">
        <Button className="max-md:min-h-11" type="button" variant="secondary" onClick={reset}>Retry</Button>
        <Link href="/learn" className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle md:min-h-9">Learner Home</Link>
      </div>
    </Alert>
  </section>;
}

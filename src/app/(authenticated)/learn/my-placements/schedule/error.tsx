"use client";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";

/** A failed schedule read is recoverable without treating it as an empty calendar. */
export default function ScheduleError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <section className="min-w-0 space-y-4">
    <PageHeader title="Schedule" />
    <Alert tone="error">
      <p>We could not load your schedule</p>
      <Button type="button" variant="secondary" onClick={reset}>Retry</Button>
    </Alert>
  </section>;
}

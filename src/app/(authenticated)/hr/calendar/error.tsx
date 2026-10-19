"use client";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";

export default function HrCalendarError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section role="alert" className="space-y-4">
      <PageHeader title="Couldn't load your recruiter calendar" />

      <p className="max-w-xl text-sm leading-6 text-body">
        Your authorized hiring events could not be
        retrieved. This is a loading error, not
        evidence that your calendar is empty.
      </p>

      <Button
        className="mt-5"
        onClick={reset}
      >
        Retry
      </Button>
    </section>
  );
}

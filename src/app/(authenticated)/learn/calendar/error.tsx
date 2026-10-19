"use client";

import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function LearnerCalendarError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="min-w-0 space-y-4">
      <PageHeader title={"Unable to load class schedule. Please try again."} />
      <Alert tone="error" className="max-w-2xl">Calendar events may be incomplete. Please try refreshing the page.</Alert>
      <div className="flex flex-wrap items-center gap-3">
        <Button className="min-h-11 md:min-h-9" onClick={reset}>
          Retry
        </Button>
      </div>
    </section>
  );
}

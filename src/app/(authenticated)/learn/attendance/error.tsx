"use client";
import { PageHeader } from "@/components/ui/page-header";

import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

export default function LearnerAttendanceError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="min-w-0 space-y-4">
      <PageHeader title="Failed to load attendance." />
      <Alert tone="error" className="max-w-2xl">
        Something went wrong loading attendance for this month. This is a load failure, not a zero-attendance result.
      </Alert>
      <div className="flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
        <Button className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={reset}>
          Retry
        </Button>
      </div>
    </section>
  );
}

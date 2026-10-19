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
      <PageHeader title={"Couldn't load attendance"} />
      <Alert tone="error" className="max-w-2xl">
        Something went wrong loading attendance for this month. This is a load failure, not a zero-attendance result.
      </Alert>
      <div className="flex flex-wrap items-center gap-3">
        <Button className="min-h-11 md:min-h-9" onClick={reset}>
          Retry
        </Button>
      </div>
    </section>
  );
}

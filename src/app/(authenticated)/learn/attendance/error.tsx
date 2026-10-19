"use client";
import { PageHeader } from "@/components/ui/page-header";

import { Button } from "@/components/ui/button";

export default function LearnerAttendanceError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section role="alert" className="min-w-0 space-y-4">
      <PageHeader title={"Couldn't load attendance"} />
      <p className="mt-2 max-w-2xl text-sm leading-6 text-body">
        Something went wrong loading attendance for this month. This is a load failure, not a zero-attendance result.
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button className="max-md:min-h-11" onClick={reset}>
          Retry
        </Button>
      </div>
    </section>
  );
}

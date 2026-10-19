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
    <section role="alert" className="space-y-3">
      <PageHeader title={"Couldn't load attendance"} />
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-body">
        Something went wrong loading attendance for this month. This is a load failure, not a zero-attendance result.
      </p>
      <div className="mt-5 flex justify-center">
        <Button onClick={reset}>
          Retry
        </Button>
      </div>
    </section>
  );
}

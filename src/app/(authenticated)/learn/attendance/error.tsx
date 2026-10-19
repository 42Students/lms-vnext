"use client";
import { ErrorState } from "@/components/ui/error-state";

import { Button } from "@/components/ui/button";

export default function LearnerAttendanceError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState title={"Couldn't load attendance"} description={"Something went wrong loading attendance for this month. This is a load failure, not a zero-attendance result."}
      action={<div className="flex flex-wrap items-center gap-3"><Button onClick={reset}>
          Retry
        </Button></div>} />
  );
}

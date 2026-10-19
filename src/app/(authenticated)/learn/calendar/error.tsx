"use client";
import { ErrorState } from "@/components/ui/error-state";

import { Button } from "@/components/ui/button";

export default function LearnerCalendarError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState title={"Unable to load class schedule. Please try again."} description={"Calendar events may be incomplete. Please try refreshing the page."}
      action={<div className="flex flex-wrap items-center gap-3"><Button onClick={reset}>
          Retry
        </Button></div>} />
  );
}

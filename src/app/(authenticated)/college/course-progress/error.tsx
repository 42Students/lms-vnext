"use client";
import { Button } from "@/components/ui/button";

import { ErrorState } from "@/components/ui/error-state";

export default function CollegeCourseProgressError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState title="Course progress unavailable"
    description="Learner content activity could not be loaded. No zero-value conclusion is assumed."
    action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>} />;
}

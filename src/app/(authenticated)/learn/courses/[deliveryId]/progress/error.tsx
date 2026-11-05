"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { ButtonLink } from "@/components/ui/button-link";

export default function LearnerCourseDrilldownError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Could not load course progress"
      description="The authorized course records could not be loaded. This does not mean the learner has no data."
      action={
        <div className="flex w-full flex-col justify-center gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:gap-3">
          <Button variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={reset}>Retry</Button>
          <ButtonLink variant="secondary" href="/learn/courses"
            className="w-full sm:w-auto">
            Courses
          </ButtonLink>
        </div>
      }
    />
  );
}

"use client";

import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";

export default function CollegeLectureHallsError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Lecture halls unavailable"
      description="The college lecture halls could not be loaded. No empty result is assumed."
      action={
        <Button type="button" variant="secondary" onClick={reset}>Retry</Button>
      }
    />
  );
}

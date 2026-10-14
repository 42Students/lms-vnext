"use client";

import { ErrorState } from "@/components/ui/error-state";

export default function CollegeLectureHallsError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Lecture halls unavailable"
      description="The college lecture halls could not be loaded. No empty result is assumed."
      action={
        <button type="button" onClick={reset}
          className="min-h-10 rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
          Retry
        </button>
      }
    />
  );
}

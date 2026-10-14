"use client";

import { ErrorState } from "@/components/ui/error-state";

export default function CollegeCoursesError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState title="Course catalogue unavailable"
    description="The course catalogue failed to load. Missing records cannot be assumed."
    action={<button type="button" onClick={reset}
      className="min-h-10 rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
      Retry
    </button>} />;
}

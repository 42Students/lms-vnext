"use client";

import { ErrorState } from "@/components/ui/error-state";

export default function CollegeHallAvailabilityError({ reset }: {
  error: Error & { digest?: string }; reset: () => void;
}) {
  return <ErrorState title="Hall schedule unavailable"
    description="Scheduled-session records could not be read. No availability has been inferred."
    action={<button type="button" onClick={reset}
      className="min-h-10 rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Retry</button>} />;
}

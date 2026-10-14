"use client";

import { ErrorState } from "@/components/ui/error-state";

export default function CollegeGroupDetailError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState
    title="Student group detail unavailable"
    description="The group could not be loaded. No membership or group status is inferred."
    action={<button type="button" onClick={reset}
      className="min-h-10 rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
      Retry
    </button>}
  />;
}

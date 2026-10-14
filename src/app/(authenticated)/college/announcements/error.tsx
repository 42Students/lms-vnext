"use client";

import { ErrorState } from "@/components/ui/error-state";

export default function CollegeAnnouncementsError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState title="College communications unavailable"
    description="Persisted notifications could not be loaded. An empty inbox cannot be assumed."
    action={<button type="button" onClick={reset}
      className="min-h-10 rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Retry</button>} />;
}

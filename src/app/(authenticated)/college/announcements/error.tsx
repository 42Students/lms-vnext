"use client";
import { Button } from "@/components/ui/button";

import { ErrorState } from "@/components/ui/error-state";

export default function CollegeAnnouncementsError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState title="College communications unavailable"
    description="Persisted notifications could not be loaded. An empty inbox cannot be assumed."
    action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>} />;
}

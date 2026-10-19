"use client";

import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";

export default function CollegeHallAvailabilityError({ reset }: {
  error: Error & { digest?: string }; reset: () => void;
}) {
  return <ErrorState title="Hall schedule unavailable"
    description="Scheduled-session records could not be read. No availability has been inferred."
    action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>} />;
}

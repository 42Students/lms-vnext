"use client";

import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
import { PageBackLink } from "@/components/ui/page-back-link";

export default function CollegeHallAvailabilityError({ reset }: {
  error: Error & { digest?: string }; reset: () => void;
}) {
  return <div className="min-w-0 space-y-4">
    <PageBackLink href="/college/lecture-halls" label="Back to lecture halls" />
    <ErrorState title="Hall schedule unavailable"
    description="Scheduled-session records could not be read. No availability has been inferred."
    action={<Button type="button" variant="secondary" onClick={reset} className="min-h-11 md:min-h-9">Retry</Button>} />
  </div>;
}

"use client";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";

import { ErrorState } from "@/components/ui/error-state";

export default function CollegeAnnouncementsError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState title="College communications unavailable"
    description="Persisted notifications could not be loaded. An empty inbox cannot be assumed."
    action={<div className="flex flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center"><Button type="button" variant="secondary" onClick={reset} className="min-h-11 md:min-h-9">Retry</Button><ButtonLink variant="secondary" href="/dashboard" className="min-h-11 w-full sm:w-auto">Back to dashboard</ButtonLink></div>} />;
}

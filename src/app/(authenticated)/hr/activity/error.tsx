"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";

export default function RouteError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <div className="min-w-0 space-y-4">
    <PageHeader title="Hiring activity" />
    <ErrorState
      title="Hiring activity could not load"
      description="The authorized employer history is unavailable. A failed read does not mean no events occurred. No applicant information has been loaded."
      action={<Button type="button" variant="secondary" onClick={reset}>Retry hiring activity</Button>}
    />
  </div>;
}

"use client";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";

export default function HrActivityError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <div className="min-w-0 max-w-full space-y-4">
    <PageHeader title="Hiring activity" />
    <ErrorState title="Hiring activity could not load"
      description="The authorized employer history is unavailable. A failed read does not mean no events occurred. No applicant information has been loaded."
      action={<Button type="button" variant="secondary" className="min-h-11 md:min-h-9" onClick={reset}>Retry hiring activity</Button>}
    />
  </div>;
}

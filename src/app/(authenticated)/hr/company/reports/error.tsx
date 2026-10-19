"use client";

import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";

export default function RouteError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <div className="min-w-0 space-y-4">
    <PageHeader title="Company Reports" />
    <ErrorState
      title="Couldn't load Company Reports"
      description="Hiring report records could not be retrieved for your selected college. This error does not establish that there are zero applications, drives or offers."
      action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>}
    />
  </div>;
}

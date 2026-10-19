"use client";

import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function RouteError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <div className="min-w-0 max-w-full space-y-4">
    <PageHeader title="Company Reports" />
    <ErrorState title="Hiring reports unavailable"
      description="Hiring report records could not be retrieved for your selected college. This error does not establish that there are zero applications, drives or offers."
      action={<Button type="button" variant="secondary" className="min-h-11 md:min-h-9" onClick={reset}>Retry</Button>}/>
  </div>;
}

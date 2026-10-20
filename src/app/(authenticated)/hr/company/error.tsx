"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";

export default function RouteError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <>
    <PageHeader title="Company & Team" />
    <ErrorState
      title="Company & Team could not load"
      description="Company and team details are unavailable. Retry to load the authorized details."
      action={<Button type="button" variant="secondary" onClick={reset}>Try again</Button>}
    />
  </>;
}

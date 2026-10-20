"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";

export default function RouteError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <>
    <PageHeader title="Calendar" />
    <ErrorState
      title="Couldn't load your recruiter calendar"
      description="Your authorized hiring events could not be retrieved. This is a loading error, not evidence that your calendar is empty."
      action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>}
    />
  </>;
}

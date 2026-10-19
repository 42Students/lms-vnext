"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";

export default function RouteError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <div className="min-w-0 space-y-4">
    <PageHeader title="Messages" />
    <ErrorState
      title="Messages are temporarily unavailable"
      description="We could not retrieve your employer-college conversations. This does not mean your messages are missing or have been marked read."
      action={<Button type="button" variant="secondary" onClick={reset}>Retry messages</Button>}
    />
  </div>;
}

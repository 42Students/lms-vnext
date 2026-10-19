"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState
    title="Couldn't load applicant export"
    description="No report can be inferred from an unavailable data source."
    action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>}
  />;
}

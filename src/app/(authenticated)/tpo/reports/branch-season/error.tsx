"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState
    title="Couldn't load branch evidence"
    description="Persisted season, offer or application evidence could not be read.\n        Missing data is not interpreted as a zero placement rate."
    action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>}
  />;
}
